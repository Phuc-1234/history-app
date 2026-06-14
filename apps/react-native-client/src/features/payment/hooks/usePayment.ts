// features/payment/hooks/usePayment.ts
import { useState, useRef, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import { useInitiatePaymentMutation } from "../api/paymentApi";
import { paymentApi, GetPaymentStatusResponse, PaymentProvider } from "../api/paymentApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";

type PaymentState =
    | { phase: "idle" }
    | { phase: "loading" }
    | { phase: "waiting" }   // browser opened, polling
    | { phase: "success"; result: GetPaymentStatusResponse }
    | { phase: "failed"; error: string };

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 30; // 60 seconds max

export function usePayment() {
    const [state, setState] = useState<PaymentState>({ phase: "idle" });
    const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const attemptsRef = useRef(0);

    const dispatch = useDispatch<AppDispatch>();
    const [initiatePayment] = useInitiatePaymentMutation();

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearTimeout(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const pollStatus = useCallback(
        async (orderId: string) => {
            attemptsRef.current += 1;

            if (attemptsRef.current > POLL_MAX_ATTEMPTS) {
                stopPolling();
                setState({ phase: "failed", error: "Hết thời gian chờ xác nhận thanh toán." });
                return;
            }

            try {
                const result = await dispatch(
                    paymentApi.endpoints.getPaymentStatus.initiate(orderId, { forceRefetch: true }),
                ).unwrap();

                if (result.status === "SUCCESS") {
                    stopPolling();
                    setState({ phase: "success", result });
                    return;
                }

                if (result.status === "FAILED") {
                    stopPolling();
                    setState({ phase: "failed", error: "Giao dịch thất bại hoặc bị hủy." });
                    return;
                }

                // Still PENDING — poll again
                pollingRef.current = setTimeout(() => pollStatus(orderId), POLL_INTERVAL_MS);
            } catch {
                // Network error during polling — try again
                pollingRef.current = setTimeout(() => pollStatus(orderId), POLL_INTERVAL_MS);
            }
        },
        [dispatch, stopPolling],
    );

    const pay = useCallback(
        async (provider: PaymentProvider, goldAmount: number) => {
            setState({ phase: "loading" });
            stopPolling();
            attemptsRef.current = 0;

            try {
                const { orderId, payUrl } = await initiatePayment({ provider, goldAmount }).unwrap();

                // Open the payment URL in the in-app browser
                setState({ phase: "waiting" });
                await WebBrowser.openBrowserAsync(payUrl);

                // Browser closed (user finished or dismissed) → start polling
                pollStatus(orderId);
            } catch (error: any) {
                const message =
                    error?.data?.error ||
                    error?.message ||
                    "Không thể tạo đơn thanh toán. Vui lòng thử lại.";
                setState({ phase: "failed", error: message });
            }
        },
        [initiatePayment, pollStatus, stopPolling],
    );

    const reset = useCallback(() => {
        stopPolling();
        attemptsRef.current = 0;
        setState({ phase: "idle" });
    }, [stopPolling]);

    return { state, pay, reset };
}
