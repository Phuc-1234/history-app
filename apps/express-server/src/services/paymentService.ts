// services/paymentService.ts
import crypto from "crypto";
import https from "https";
import http from "http";
import { prisma } from "@history-app/shared";
import {
    PaymentProvider,
    MoMoIpnPayload,
    ZaloPayCallbackPayload,
    ZaloPayCallbackData,
} from "../types/payment";

const GOLD_PRICE_VND = 10_000; // 10,000 VND = 1 Gold

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

// ─── MoMo ─────────────────────────────────────────────────────────────────────

async function createMoMoOrder(
    orderId: string,
    amountVnd: number,
    ipnUrl: string,
    redirectUrl: string,
): Promise<{ payUrl: string }> {
    const partnerCode = process.env.MOMO_PARTNER_CODE!;
    const accessKey = process.env.MOMO_ACCESS_KEY!;
    const secretKey = process.env.MOMO_SECRET_KEY!;
    const endpoint = process.env.MOMO_ENDPOINT!;

    const requestId = orderId;
    const orderInfo = `Mua ${amountVnd / GOLD_PRICE_VND} Gold`;
    const extraData = "";
    const requestType = "payWithMethod";

    const rawSignature = [
        `accessKey=${accessKey}`,
        `amount=${amountVnd}`,
        `extraData=${extraData}`,
        `ipnUrl=${ipnUrl}`,
        `orderId=${orderId}`,
        `orderInfo=${orderInfo}`,
        `partnerCode=${partnerCode}`,
        `redirectUrl=${redirectUrl}`,
        `requestId=${requestId}`,
        `requestType=${requestType}`,
    ].join("&");

    const signature = hmacSHA256(rawSignature, secretKey);

    const body = {
        partnerCode,
        accessKey,
        requestId,
        amount: amountVnd,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang: "vi",
    };

    const response = await postJson(endpoint, body);

    if (response.resultCode !== 0) {
        throw new Error(`MoMo error: ${response.message} (code ${response.resultCode})`);
    }

    return { payUrl: response.payUrl };
}

function verifyMoMoSignature(payload: MoMoIpnPayload): boolean {
    const secretKey = process.env.MOMO_SECRET_KEY!;
    const accessKey = process.env.MOMO_ACCESS_KEY!;

    const rawSignature = [
        `accessKey=${accessKey}`,
        `amount=${payload.amount}`,
        `extraData=${payload.extraData}`,
        `message=${payload.message}`,
        `orderId=${payload.orderId}`,
        `orderInfo=${payload.orderInfo}`,
        `orderType=${payload.orderType}`,
        `partnerCode=${payload.partnerCode}`,
        `payType=${payload.payType}`,
        `requestId=${payload.requestId}`,
        `responseTime=${payload.responseTime}`,
        `resultCode=${payload.resultCode}`,
        `transId=${payload.transId}`,
    ].join("&");

    const expected = hmacSHA256(rawSignature, secretKey);
    return expected === payload.signature;
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
    const embedData = JSON.stringify({ orderId }); // pass our orderId so callback can find it
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
        goldAmount: number,
    ): Promise<{ orderId: string; payUrl: string; zpTransToken?: string; amountVnd: number; goldAmount: number }> {
        const amountVnd = goldAmount * GOLD_PRICE_VND;
        const orderId = crypto.randomUUID();
        // Expose webhook/IPN URL based on configured environment variable or local computer IP
        const ipnUrl = process.env.PAYMENT_IPN_URL || `http://${process.env.LOCAL_COMPUTER_IP || 'localhost'}:5000`;

        let payUrl = "";
        let zpTransToken: string | undefined = undefined;
        // providerOrderId stores app_trans_id for ZaloPay or orderId for MoMo/mock
        let providerOrderId = orderId;

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
        } else if (provider === "MOMO" && process.env.MOMO_SECRET_KEY) {
            try {
                const callbackUrl = `${ipnUrl}/api/payment/momo/webhook`;
                const redirectUrl = `${ipnUrl}/api/payment/mock-checkout?orderId=${orderId}&status=success`;
                const momoResult = await createMoMoOrder(orderId, amountVnd, callbackUrl, redirectUrl);
                payUrl = momoResult.payUrl;
            } catch (momoError: any) {
                console.warn("Failed to create real MoMo order, falling back to mock:", momoError.message);
                payUrl = `${ipnUrl}/api/payment/mock-checkout?orderId=${orderId}`;
            }
        } else {
            payUrl = `${ipnUrl}/api/payment/mock-checkout?orderId=${orderId}`;
        }

        // Persist a PENDING record first so webhook/polling can find it
        await prisma.goldPurchase.create({
            data: {
                id: orderId,
                userId,
                goldAmount,
                amountVnd,
                provider,
                status: "PENDING",
                providerOrderId, // For ZaloPay: app_trans_id. For others: orderId.
            },
        });

        return { orderId, payUrl, zpTransToken, amountVnd, goldAmount };
    }

    /** Called when MoMo IPN webhook arrives */
    async handleMoMoWebhook(payload: MoMoIpnPayload): Promise<void> {
        if (!verifyMoMoSignature(payload)) {
            throw new Error("Invalid MoMo signature");
        }

        const purchase = await prisma.goldPurchase.findFirst({
            where: { id: payload.orderId },
        });
        if (!purchase || purchase.status !== "PENDING") return;

        if (payload.resultCode === 0) {
            // Success
            await prisma.$transaction([
                prisma.goldPurchase.update({
                    where: { id: purchase.id },
                    data: {
                        status: "SUCCESS",
                        providerTransId: String(payload.transId),
                    },
                }),
                prisma.user.update({
                    where: { id: purchase.userId },
                    data: { totalGold: { increment: purchase.goldAmount } },
                }),
            ]);
        } else {
            await prisma.goldPurchase.update({
                where: { id: purchase.id },
                data: { status: "FAILED" },
            });
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
        if (!purchase || purchase.status !== "PENDING") return;

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
        };
    }
}

export const paymentService = new PaymentService();
