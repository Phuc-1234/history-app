// features/payment/api/paymentApi.ts
import { apiSlice } from "@/services/apiSlice";

// ─── Local Types (mirrors express-server/src/types/payment.ts) ────────────────

export type PaymentProvider = "MOMO" | "ZALOPAY";
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
}

export interface GetPaymentStatusResponse {
    orderId: string;
    status: PaymentStatus;
    provider: PaymentProvider;
    goldAmount: number;
    amountVnd: number;
    providerTransId: string | null;
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
    }),
    overrideExisting: __DEV__,
});

export const {
    useInitiatePaymentMutation,
    useGetPaymentStatusQuery,
} = paymentApi;
