// types/payment.ts
// Payment types are intentionally kept inside express-server (not shared)
// so the backend can be extracted independently later.

export type PaymentProvider = "MOMO" | "ZALOPAY";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface InitiatePaymentRequestBody {
    provider: PaymentProvider;
    /** Number of Gold units to buy. Each unit costs 10,000 VND. */
    goldAmount: number;
}

// ─── Response Bodies ──────────────────────────────────────────────────────────

export interface InitiatePaymentResponse {
    orderId: string;
    payUrl: string;
    amountVnd: number;
    goldAmount: number;
}

export interface GetPaymentStatusResponse {
    orderId: string;
    status: PaymentStatus;
    provider: PaymentProvider;
    goldAmount: number;
    amountVnd: number;
    providerTransId: string | null;
}

// ─── Internal Service Types ───────────────────────────────────────────────────

/** Raw payload MoMo sends to the IPN webhook endpoint */
export interface MoMoIpnPayload {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    orderInfo: string;
    orderType: string;
    transId: number;
    resultCode: number;
    message: string;
    payType: string;
    responseTime: number;
    extraData: string;
    signature: string;
}

/** Raw payload ZaloPay sends to the callback endpoint */
export interface ZaloPayCallbackPayload {
    data: string;       // JSON string
    mac: string;
    type: number;
}

/** Parsed ZaloPay data object (inside payload.data) */
export interface ZaloPayCallbackData {
    app_id: number;
    app_trans_id: string;
    app_time: number;
    app_user: string;
    amount: number;
    embed_data: string;
    item: string;
    zp_trans_id: number;
    server_time: number;
    channel: number;
    merchant_user_id: string;
    user_fee_amount: number;
    discount_amount: number;
}
