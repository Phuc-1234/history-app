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

async function createZaloPayOrder(
    orderId: string,
    amountVnd: number,
    ipnUrl: string,
): Promise<{ payUrl: string }> {
    const appId = parseInt(process.env.ZALOPAY_APP_ID!);
    const key1 = process.env.ZALOPAY_KEY1!;
    const endpoint = process.env.ZALOPAY_ENDPOINT!;

    const appUser = "user";
    const appTime = Date.now();
    // ZaloPay requires app_trans_id format: yymmdd_uniqueid
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const appTransId = `${datePart}_${orderId}`;
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
        throw new Error(`ZaloPay error: ${response.return_message}`);
    }

    return { payUrl: response.order_url };
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
    /** Create a payment order and return a payUrl */
    async initiatePayment(
        userId: string,
        provider: PaymentProvider,
        goldAmount: number,
    ): Promise<{ orderId: string; payUrl: string; amountVnd: number; goldAmount: number }> {
        const amountVnd = goldAmount * GOLD_PRICE_VND;
        const orderId = crypto.randomUUID();
        const ipnUrl = process.env.PAYMENT_IPN_URL!;
        // Deep link back to app after payment (adjust scheme to match your app)
        const redirectUrl = `${ipnUrl}/api/payment/redirect`;

        // Persist a PENDING record first so webhook can find it
        await prisma.goldPurchase.create({
            data: {
                id: orderId,
                userId,
                goldAmount,
                amountVnd,
                provider,
                status: "PENDING",
                providerOrderId: orderId,
            },
        });

        let payUrl: string;

        if (provider === "MOMO") {
            const result = await createMoMoOrder(orderId, amountVnd, `${ipnUrl}/api/payment/momo/webhook`, redirectUrl);
            payUrl = result.payUrl;
        } else {
            const result = await createZaloPayOrder(orderId, amountVnd, `${ipnUrl}/api/payment/zalopay/callback`);
            payUrl = result.payUrl;
        }

        return { orderId, payUrl, amountVnd, goldAmount };
    }

    /** Called when MoMo IPN webhook arrives */
    async handleMoMoWebhook(payload: MoMoIpnPayload): Promise<void> {
        if (!verifyMoMoSignature(payload)) {
            throw new Error("Invalid MoMo signature");
        }

        const purchase = await prisma.goldPurchase.findUnique({
            where: { providerOrderId: payload.orderId },
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
            where: { providerOrderId: orderId },
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

    /** App polls this to know if payment succeeded */
    async getPaymentStatus(orderId: string) {
        const purchase = await prisma.goldPurchase.findUnique({
            where: { providerOrderId: orderId },
            select: {
                providerOrderId: true,
                status: true,
                provider: true,
                goldAmount: true,
                amountVnd: true,
                providerTransId: true,
            },
        });

        if (!purchase) return null;

        return {
            orderId: purchase.providerOrderId,
            status: purchase.status,
            provider: purchase.provider,
            goldAmount: purchase.goldAmount,
            amountVnd: purchase.amountVnd,
            providerTransId: purchase.providerTransId,
        };
    }
}

export const paymentService = new PaymentService();
