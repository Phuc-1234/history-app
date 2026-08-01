// services/paymentService.ts
import crypto from "crypto";
import https from "https";
import http from "http";
import { prisma } from "@history-app/shared";
import {
    PaymentProvider,
    ZaloPayCallbackPayload,
    ZaloPayCallbackData,
    SePayWebhookPayload,
} from "../types/payment";

const GOLD_PRICE_VND = 2_000; // 2,000 VND = 1 Gold (TEST MODE)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hmacSHA256(data: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function postJson(url: string, body: object): Promise<any> {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === "https:";
        const lib = isHttps ? https : http;

        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
            },
        };

        const req = lib.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve(data);
                }
            });
        });

        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}

// ─── ZaloPay ──────────────────────────────────────────────────────────────────

/** Build the ZaloPay app_trans_id from our internal orderId */
function buildZaloAppTransId(orderId: string): string {
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    // ZaloPay requires alphanumeric uniqueid - remove dashes from UUID
    const uniquePart = orderId.replace(/-/g, "").slice(0, 20);
    return `${datePart}_${uniquePart}`;
}

async function createZaloPayOrder(
    orderId: string,
    amountVnd: number,
    ipnUrl: string,
): Promise<{ payUrl: string; zpTransToken?: string; appTransId: string }> {
    const appId = parseInt(process.env.ZALOPAY_APP_ID!);
    const key1 = process.env.ZALOPAY_KEY1!;
    const endpoint = process.env.ZALOPAY_ENDPOINT!;

    const appUser = "user";
    const appTime = Date.now();
    // ZaloPay requires app_trans_id format: yymmdd_uniqueid
    const appTransId = buildZaloAppTransId(orderId);
    const embedData = JSON.stringify({ orderId, redirecturl: "historyapp://" }); // pass orderId and redirecturl so ZaloPay returns back to app
    const item = JSON.stringify([]);
    const description = `Mua ${amountVnd / GOLD_PRICE_VND} Gold - HistoryApp`;

    const rawMac = `${appId}|${appTransId}|${appUser}|${amountVnd}|${appTime}|${embedData}|${item}`;
    const mac = hmacSHA256(rawMac, key1);

    const body = {
        app_id: appId,
        app_user: appUser,
        app_time: appTime,
        amount: amountVnd,
        app_trans_id: appTransId,
        embed_data: embedData,
        item,
        description,
        callback_url: ipnUrl,
        mac,
    };

    const response = await postJson(endpoint, body);

    if (response.return_code !== 1) {
        throw new Error(`ZaloPay error: ${response.return_message} (code ${response.return_code})`);
    }

    return { 
        payUrl: response.order_url, 
        zpTransToken: response.zp_trans_token,
        appTransId 
    };
}

/**
 * Query ZaloPay directly for the order status.
 * Returns: 1 = SUCCESS, 2 = FAILED, 3 = PENDING
 */
async function queryZaloPayOrder(appTransId: string): Promise<{
    returnCode: number; // 1=success, 2=failed, 3=pending
    zpTransId?: string;
}> {
    const appId = parseInt(process.env.ZALOPAY_APP_ID!);
    const key1 = process.env.ZALOPAY_KEY1!;
    const queryEndpoint = "https://sb-openapi.zalopay.vn/v2/query";

    // MAC = HMAC_SHA256(app_id + "|" + app_trans_id + "|" + key1, key1)
    const rawMac = `${appId}|${appTransId}|${key1}`;
    const mac = hmacSHA256(rawMac, key1);

    const body = {
        app_id: appId,
        app_trans_id: appTransId,
        mac,
    };

    try {
        const response = await postJson(queryEndpoint, body);
        console.log(`[ZaloPay Query] app_trans_id=${appTransId} → return_code=${response.return_code}`);
        return {
            returnCode: response.return_code ?? 3,
            zpTransId: response.zp_trans_id ? String(response.zp_trans_id) : undefined,
        };
    } catch (err) {
        console.warn("[ZaloPay Query] failed to reach ZaloPay:", err);
        return { returnCode: 3 }; // treat as pending on network error
    }
}

function verifyZaloPayCallback(payload: ZaloPayCallbackPayload): {
    valid: boolean;
    data: ZaloPayCallbackData | null;
} {
    const key2 = process.env.ZALOPAY_KEY2!;
    const expectedMac = hmacSHA256(payload.data, key2);

    if (expectedMac !== payload.mac) {
        return { valid: false, data: null };
    }

    try {
        const data: ZaloPayCallbackData = JSON.parse(payload.data);
        return { valid: true, data };
    } catch {
        return { valid: false, data: null };
    }
}

// ─── Main Service Class ───────────────────────────────────────────────────────

export class PaymentService {
    async initiatePayment(
        userId: string,
        provider: PaymentProvider,
        goldAmount?: number,
        packageId?: string,
    ): Promise<{
        orderId: string;
        payUrl: string;
        zpTransToken?: string;
        amountVnd: number;
        goldAmount: number;
        vietQrUrl?: string;
        bankId?: string;
        accountNo?: string;
        accountName?: string;
        providerOrderId?: string;
    }> {
        let amountVnd = 0;
        let finalGoldAmount = goldAmount || 0;

        if (packageId) {
            const pkg = await prisma.goldPackage.findUnique({ where: { id: packageId } });
            if (!pkg || !pkg.isActive) {
                throw new Error("Gói nạp vàng không tồn tại hoặc đã bị ẩn.");
            }
            amountVnd = pkg.priceVnd;
            finalGoldAmount = pkg.goldAmount + pkg.bonusGold;
        } else {
            if (!goldAmount || goldAmount < 1) {
                throw new Error("Số lượng vàng không hợp lệ.");
            }
            amountVnd = goldAmount * GOLD_PRICE_VND;
            finalGoldAmount = goldAmount;
        }

        const orderId = crypto.randomUUID();
        // Expose webhook/IPN URL based on configured environment variable or local computer IP
        const ipnUrl = process.env.PAYMENT_IPN_URL || `http://${process.env.LOCAL_COMPUTER_IP || 'localhost'}:5000`;

        let payUrl = "";
        let zpTransToken: string | undefined = undefined;
        // providerOrderId stores app_trans_id for ZaloPay or orderId/paymentCode for SePay/mock
        let providerOrderId: string = orderId;

        let bankId = "";
        let accountNo = "";
        let accountName = "";
        let vietQrUrl = "";

        if (provider === "ZALOPAY") {
            try {
                const callbackUrl = `${ipnUrl}/api/payment/zalopay/callback`;
                const zaloResult = await createZaloPayOrder(orderId, amountVnd, callbackUrl);
                payUrl = zaloResult.payUrl;
                zpTransToken = zaloResult.zpTransToken;
                // Store app_trans_id so we can query ZaloPay later
                providerOrderId = zaloResult.appTransId;
                console.log(`[ZaloPay] Created order. app_trans_id=${providerOrderId}, order_url=${payUrl}, token=${zpTransToken}`);
            } catch (zaloError: any) {
                console.error("Failed to create ZaloPay order:", zaloError.message);
                throw zaloError; // surface the real error to the client
            }
        } else if (provider === "SEPAY") {
            // Generate unique transfer content with only numbers (e.g. DH182739) to match SePay's numeric configuration
            const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6 random digits
            providerOrderId = "DH" + randomDigits;
            payUrl = `${ipnUrl}/api/payment/sepay-checkout?orderId=${orderId}`;

            bankId = process.env.SEPAY_BANK_ID || "MB";
            accountNo = process.env.SEPAY_ACCOUNT_NO || "0999999999";
            accountName = process.env.SEPAY_ACCOUNT_NAME || "NGUYEN VAN A";
            vietQrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amountVnd}&addInfo=${providerOrderId}&accountName=${encodeURIComponent(accountName)}`;
        } else {
            payUrl = `${ipnUrl}/api/payment/mock-checkout?orderId=${orderId}`;
        }

        // Persist a PENDING record first so webhook/polling can find it
        await prisma.goldPurchase.create({
            data: {
                id: orderId,
                userId,
                goldAmount: finalGoldAmount,
                amountVnd,
                provider,
                status: "PENDING",
                providerOrderId, // For ZaloPay: app_trans_id. For SePay: transfer content code.
            },
        });

        return {
            orderId,
            payUrl,
            zpTransToken,
            amountVnd,
            goldAmount: finalGoldAmount,
            vietQrUrl,
            bankId,
            accountNo,
            accountName,
            providerOrderId,
        };
    }

    /** Called when SePay webhook arrives */
    async handleSePayWebhook(payload: SePayWebhookPayload): Promise<void> {
        if (payload.transferType !== "in") {
            console.log(`[SePay Webhook] Ignored non-incoming transaction: ${payload.transferType}`);
            return;
        }

        const content = payload.content || "";
        // Support both old 10-char codes and new 5-char codes
        const match = content.match(/(DH|SUB)[A-Z0-9]{5,10}/i);
        if (!match) {
            console.log(`[SePay Webhook] Ignored transaction: missing or invalid payment code in content "${content}"`);
            return;
        }
        const paymentCode = match[0].toUpperCase();

        if (paymentCode.startsWith("DH9")) {
            const subscription = await prisma.subscription.findUnique({
                where: { providerOrderId: paymentCode },
            });

            if (!subscription) {
                throw new Error(`No subscription record found for code: ${paymentCode}`);
            }

            if (subscription.status !== "PENDING") {
                console.log(`[SePay Webhook] Subscription ${subscription.id} already processed. Status: ${subscription.status}`);
                return;
            }

            if (payload.transferAmount < subscription.amountVnd) {
                throw new Error(`Amount mismatch. Expected ${subscription.amountVnd} but got ${payload.transferAmount}`);
            }

            await this.activateSubscription(subscription.id, String(payload.id || payload.referenceCode));
        } else if (paymentCode.startsWith("DH")) {
            const purchase = await prisma.goldPurchase.findUnique({
                where: { providerOrderId: paymentCode },
            });

            if (!purchase) {
                throw new Error(`No purchase record found for code: ${paymentCode}`);
            }

            if (purchase.status !== "PENDING") {
                console.log(`[SePay Webhook] Order ${purchase.id} already processed. Status: ${purchase.status}`);
                return;
            }

            if (payload.transferAmount < purchase.amountVnd) {
                throw new Error(`Amount mismatch. Expected ${purchase.amountVnd} but got ${payload.transferAmount}`);
            }

            await prisma.$transaction([
                prisma.goldPurchase.update({
                    where: { id: purchase.id },
                    data: {
                        status: "SUCCESS",
                        providerTransId: String(payload.id || payload.referenceCode),
                    },
                }),
                prisma.user.update({
                    where: { id: purchase.userId },
                    data: { totalGold: { increment: purchase.goldAmount } },
                }),
            ]);

            console.log(`[SePay Webhook] Processed successfully. Order: ${purchase.id}, Gold credited: ${purchase.goldAmount}`);
        } else if (paymentCode.startsWith("SUB")) {
            const subscription = await prisma.subscription.findUnique({
                where: { providerOrderId: paymentCode },
            });

            if (!subscription) {
                throw new Error(`No subscription record found for code: ${paymentCode}`);
            }

            if (subscription.status !== "PENDING") {
                console.log(`[SePay Webhook] Subscription ${subscription.id} already processed. Status: ${subscription.status}`);
                return;
            }

            if (payload.transferAmount < subscription.amountVnd) {
                throw new Error(`Amount mismatch. Expected ${subscription.amountVnd} but got ${payload.transferAmount}`);
            }

            await this.activateSubscription(subscription.id, String(payload.id || payload.referenceCode));
        }
    }

    /** Called when ZaloPay callback arrives */
    async handleZaloPayCallback(payload: ZaloPayCallbackPayload): Promise<void> {
        const { valid, data } = verifyZaloPayCallback(payload);
        if (!valid || !data) {
            throw new Error("Invalid ZaloPay MAC");
        }

        // Extract our orderId from embed_data
        let orderId: string;
        try {
            const embedData = JSON.parse(data.embed_data);
            orderId = embedData.orderId;
        } catch {
            throw new Error("Cannot parse ZaloPay embed_data");
        }

        const purchase = await prisma.goldPurchase.findUnique({
            where: { id: orderId },
        });

        if (purchase) {
            if (purchase.status !== "PENDING") return;

            await prisma.$transaction([
                prisma.goldPurchase.update({
                    where: { id: purchase.id },
                    data: {
                        status: "SUCCESS",
                        providerTransId: String(data.zp_trans_id),
                    },
                }),
                prisma.user.update({
                    where: { id: purchase.userId },
                    data: { totalGold: { increment: purchase.goldAmount } },
                }),
            ]);
            console.log(`[ZaloPay Callback] Gold credited for Order: ${purchase.id}`);
        } else {
            const subscription = await prisma.subscription.findUnique({
                where: { id: orderId },
            });
            if (subscription) {
                if (subscription.status !== "PENDING") return;
                await this.activateSubscription(subscription.id, String(data.zp_trans_id));
            }
        }
    }

    /**
     * App polls this to know if payment succeeded.
     * For ZaloPay: actively queries ZaloPay API when status is still PENDING,
     * so the app doesn't need a public callback URL in sandbox mode.
     */
    async getPaymentStatus(orderId: string) {
        const purchase = await prisma.goldPurchase.findUnique({
            where: { id: orderId },
        });

        if (!purchase) return null;

        // Local vars to hold potentially-updated status
        let resolvedStatus = purchase.status as string;
        let resolvedTransId = purchase.providerTransId;

        // If still PENDING and provider is ZaloPay → proactively query ZaloPay
        if (purchase.status === "PENDING" && purchase.provider === "ZALOPAY") {
            try {
                const { returnCode, zpTransId } = await queryZaloPayOrder(purchase.providerOrderId);

                if (returnCode === 1) {
                    // Payment succeeded → update DB
                    await prisma.$transaction([
                        prisma.goldPurchase.update({
                            where: { id: purchase.id },
                            data: {
                                status: "SUCCESS",
                                providerTransId: zpTransId ?? null,
                            },
                        }),
                        prisma.user.update({
                            where: { id: purchase.userId },
                            data: { totalGold: { increment: purchase.goldAmount } },
                        }),
                    ]);
                    resolvedStatus = "SUCCESS";
                    resolvedTransId = zpTransId ?? null;
                } else if (returnCode === 2) {
                    // Payment failed
                    await prisma.goldPurchase.update({
                        where: { id: purchase.id },
                        data: { status: "FAILED" },
                    });
                    resolvedStatus = "FAILED";
                }
                // returnCode === 3: still PENDING, do nothing
            } catch (err) {
                console.warn("[getPaymentStatus] ZaloPay query failed:", err);
            }
        }

        return {
            orderId: purchase.id,
            status: resolvedStatus,
            provider: purchase.provider,
            goldAmount: purchase.goldAmount,
            amountVnd: purchase.amountVnd,
            providerTransId: resolvedTransId,
            providerOrderId: purchase.providerOrderId,
        };
    }

    /**
     * Creates a new pending Pro Subscription.
     */
    /**
     * Creates a new pending Pro Subscription.
     */
    async initiateSubscription(
        userId: string,
        provider: PaymentProvider,
        packageId?: string,
    ): Promise<{
        orderId: string;
        payUrl: string;
        zpTransToken?: string;
        amountVnd: number;
        vietQrUrl?: string;
        bankId?: string;
        accountNo?: string;
        accountName?: string;
        providerOrderId?: string;
    }> {
        let amountVnd = 2000; // Fallback default 2000đ
        let durationDays = 30; // Fallback default 30 days

        if (packageId) {
            const pkg = await prisma.proPackage.findUnique({ where: { id: packageId } });
            if (!pkg || !pkg.isActive) {
                throw new Error("Gói Đăng ký Pro không tồn tại hoặc đã bị ẩn.");
            }
            amountVnd = pkg.priceVnd;
            durationDays = pkg.durationDays;
        }

        const orderId = crypto.randomUUID();
        const ipnUrl = process.env.PAYMENT_IPN_URL || `http://${process.env.LOCAL_COMPUTER_IP || 'localhost'}:5000`;

        let payUrl = "";
        let zpTransToken: string | undefined = undefined;
        let providerOrderId: string = orderId;

        let bankId = "";
        let accountNo = "";
        let accountName = "";
        let vietQrUrl = "";

        if (provider === "ZALOPAY") {
            try {
                const callbackUrl = `${ipnUrl}/api/payment/zalopay/callback`;
                const zaloResult = await createZaloPayOrder(orderId, amountVnd, callbackUrl);
                payUrl = zaloResult.payUrl;
                zpTransToken = zaloResult.zpTransToken;
                providerOrderId = zaloResult.appTransId;
                console.log(`[ZaloPay Subscription] Created order. app_trans_id=${providerOrderId}, order_url=${payUrl}, token=${zpTransToken}`);
            } catch (zaloError: any) {
                console.error("Failed to create ZaloPay subscription order:", zaloError.message);
                throw zaloError;
            }
        } else if (provider === "SEPAY") {
            const randomDigits = Math.floor(100000 + Math.random() * 900000);
            providerOrderId = "DH9" + randomDigits;
            payUrl = `${ipnUrl}/api/subscription/checkout?orderId=${orderId}`;

            bankId = process.env.SEPAY_BANK_ID || "MB";
            accountNo = process.env.SEPAY_ACCOUNT_NO || "0999999999";
            accountName = process.env.SEPAY_ACCOUNT_NAME || "NGUYEN VAN A";
            vietQrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amountVnd}&addInfo=${providerOrderId}&accountName=${encodeURIComponent(accountName)}`;
        } else {
            payUrl = `${ipnUrl}/api/subscription/checkout?orderId=${orderId}`;
        }

        await prisma.subscription.create({
            data: {
                id: orderId,
                userId,
                status: "PENDING",
                amountVnd,
                provider,
                providerOrderId,
                autoRenew: true,
            },
        });

        return {
            orderId,
            payUrl,
            zpTransToken,
            amountVnd,
            vietQrUrl,
            bankId,
            accountNo,
            accountName,
            providerOrderId,
        };
    }

    /**
     * Activates a pending subscription and marks the user as Pro.
     */
    async activateSubscription(subscriptionId: string, providerTransId: string, durationDays: number = 30): Promise<void> {
        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });
        if (!subscription || subscription.status !== "PENDING") return;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);

        await prisma.$transaction([
            prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    status: "ACTIVE",
                    providerTransId,
                    startDate,
                    endDate,
                },
            }),
            prisma.user.update({
                where: { id: subscription.userId },
                data: {
                    isPro: true,
                    proExpiresAt: endDate,
                },
            }),
        ]);
        console.log(`[Subscription Service] Activated subscription ${subscriptionId} for User: ${subscription.userId} (${durationDays} days)`);
    }

    /**
     * Cancels the auto renewal of an active subscription.
     */
    async cancelSubscription(userId: string): Promise<{ success: boolean; message: string }> {
        const activeSub = await prisma.subscription.findFirst({
            where: {
                userId,
                status: "ACTIVE",
                autoRenew: true,
            },
            orderBy: {
                endDate: "desc",
            },
        });

        if (!activeSub) {
            return { success: false, message: "Không tìm thấy gói đăng ký hoạt động có tự động gia hạn." };
        }

        await prisma.subscription.update({
            where: { id: activeSub.id },
            data: {
                autoRenew: false,
                status: "CANCELLED",
            },
        });

        return { success: true, message: "Hủy tự động gia hạn thành công. Bạn vẫn có thể sử dụng gói đến hết chu kỳ." };
    }

    /**
     * Queries the status of a subscription.
     */
    async getSubscriptionStatus(orderId: string) {
        const subscription = await prisma.subscription.findUnique({
            where: { id: orderId },
        });

        if (!subscription) return null;

        let resolvedStatus = subscription.status as string;
        let resolvedTransId = subscription.providerTransId;

        if (subscription.status === "PENDING" && subscription.provider === "ZALOPAY") {
            try {
                const { returnCode, zpTransId } = await queryZaloPayOrder(subscription.providerOrderId);

                if (returnCode === 1) {
                    await this.activateSubscription(subscription.id, zpTransId || "MOCK_ZALO_TRANS");
                    resolvedStatus = "ACTIVE";
                    resolvedTransId = zpTransId ?? null;
                } else if (returnCode === 2) {
                    await prisma.subscription.update({
                        where: { id: subscription.id },
                        data: { status: "FAILED" },
                    });
                    resolvedStatus = "FAILED";
                }
            } catch (err) {
                console.warn("[getSubscriptionStatus] ZaloPay query failed:", err);
            }
        }

        return {
            orderId: subscription.id,
            status: resolvedStatus,
            provider: subscription.provider,
            amountVnd: subscription.amountVnd,
            providerTransId: resolvedTransId,
            providerOrderId: subscription.providerOrderId,
            autoRenew: subscription.autoRenew,
            endDate: subscription.endDate,
        };
    }
}

export const paymentService = new PaymentService();
