// features/payment/api/paymentApi.ts
import { apiSlice } from "@/services/apiSlice";

// ─── Local Types (mirrors express-server/src/types/payment.ts) ────────────────

export type PaymentProvider = "MOMO" | "ZALOPAY" | "SEPAY";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface InitiatePaymentRequestBody {
    provider: PaymentProvider;
    goldAmount: number;
}

export interface InitiatePaymentResponse {
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
}

export interface GetPaymentStatusResponse {
    orderId: string;
    status: PaymentStatus;
    provider: PaymentProvider;
    goldAmount: number;
    amountVnd: number;
    providerTransId: string | null;
}

export interface InitiateSubscriptionRequestBody {
    provider: PaymentProvider;
    packageId?: string;
}

export interface InitiateSubscriptionResponse {
    orderId: string;
    payUrl: string;
    zpTransToken?: string;
    amountVnd: number;
    vietQrUrl?: string;
    bankId?: string;
    accountNo?: string;
    accountName?: string;
    providerOrderId?: string;
}

export interface GetSubscriptionStatusResponse {
    orderId: string;
    status: string;
    provider: PaymentProvider;
    amountVnd: number;
    providerTransId: string | null;
    providerOrderId: string;
    autoRenew: boolean;
    endDate: string | null;
}

// ─── RTK Query endpoints ──────────────────────────────────────────────────────

export const paymentApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        initiatePayment: builder.mutation<InitiatePaymentResponse, InitiatePaymentRequestBody>({
            query: (body) => ({
                url: "/api/payment/initiate",
                method: "POST",
                body,
            }),
        }),

        getPaymentStatus: builder.query<GetPaymentStatusResponse, string>({
            query: (orderId) => ({
                url: `/api/payment/status/${orderId}`,
                method: "GET",
            }),
        }),

        initiateSubscription: builder.mutation<InitiateSubscriptionResponse, InitiateSubscriptionRequestBody>({
            query: (body) => ({
                url: "/api/subscription/subscribe",
                method: "POST",
                body,
            }),
        }),

        cancelSubscription: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: "/api/subscription/cancel",
                method: "POST",
            }),
        }),

        getSubscriptionStatus: builder.query<GetSubscriptionStatusResponse, string>({
            query: (orderId) => ({
                url: `/api/subscription/status/${orderId}`,
                method: "GET",
            }),
        }),
    }),
    overrideExisting: __DEV__,
});

export const {
    useInitiatePaymentMutation,
    useGetPaymentStatusQuery,
    useInitiateSubscriptionMutation,
    useCancelSubscriptionMutation,
    useGetSubscriptionStatusQuery,
} = paymentApi;

