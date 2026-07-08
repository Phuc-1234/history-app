// features/payment/hooks/usePayment.ts
import { useState, useRef, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import { useInitiatePaymentMutation } from "../api/paymentApi";
import { paymentApi, GetPaymentStatusResponse, PaymentProvider } from "../api/paymentApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";

import { apiSlice } from "@/services/apiSlice";

// Safe import of ZaloPay native module (prevent crash in Expo Go)
let ReactNativeZalopay: any = null;
try {
    ReactNativeZalopay = require("../../../../modules/react-native-zalopay").default;
} catch (e) {
    console.warn("[ZaloPay] Native module is not available in this environment.");
}

type PaymentState =
    | { phase: "idle" }
    | { phase: "loading" }
    | {
          phase: "waiting";
          orderId: string;
          vietQrUrl?: string;
          bankId?: string;
          accountNo?: string;
          accountName?: string;
          providerOrderId?: string;
          amountVnd: number;
          provider: PaymentProvider;
      }
    | { phase: "success"; result: GetPaymentStatusResponse }
    | { phase: "failed"; error: string };

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 150; // 300 seconds (5 phút) max

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
                    try {
                        WebBrowser.dismissBrowser();
                    } catch (e) {
                        console.warn("[WebBrowser] dismiss failed:", e);
                    }
                    // Refetch profile to update gold amount instantly
                    dispatch(apiSlice.util.invalidateTags(["User"]));
                    setState({ phase: "success", result });
                    return;
                }

                if (result.status === "FAILED") {
                    stopPolling();
                    try {
                        WebBrowser.dismissBrowser();
                    } catch (e) {
                        console.warn("[WebBrowser] dismiss failed:", e);
                    }
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
                const initRes = await initiatePayment({ provider, goldAmount }).unwrap();
                const { orderId, payUrl, zpTransToken, vietQrUrl, bankId, accountNo, accountName, providerOrderId, amountVnd } = initRes;

                if (provider === "SEPAY" && vietQrUrl) {
                    setState({
                        phase: "waiting",
                        orderId,
                        vietQrUrl,
                        bankId,
                        accountNo,
                        accountName,
                        providerOrderId,
                        amountVnd,
                        provider,
                    });
                    pollStatus(orderId);
                    return;
                }

                if (provider === "ZALOPAY" && zpTransToken && ReactNativeZalopay) {
                    try {
                        console.log("[ZaloPay] Initiating native payment flow with token:", zpTransToken);
                        setState({
                            phase: "waiting",
                            orderId,
                            amountVnd,
                            provider,
                        });
                        
                        // Start polling immediately in parallel so we don't get stuck if deep link fails
                        pollStatus(orderId);
                        
                        // Initialize ZaloPay SDK with Sandbox AppID 2554
                        ReactNativeZalopay.init(2554, true);

                        const result = await ReactNativeZalopay.payOrder(zpTransToken);
                        console.log("[ZaloPay] Native payment result:", result);

                        if (result.status === "cancelled") {
                            stopPolling();
                            setState({ phase: "failed", error: "Giao dịch đã bị hủy." });
                        } else if (result.status === "error") {
                            stopPolling();
                            setState({ phase: "failed", error: `Lỗi thanh toán: ${result.errorCode || "Unknown"}` });
                        }
                    } catch (sdkError: any) {
                        console.warn("[ZaloPay] Native module error, falling back to web flow:", sdkError);
                        setState({
                            phase: "waiting",
                            orderId,
                            amountVnd,
                            provider,
                        });
                        pollStatus(orderId);
                        await WebBrowser.openBrowserAsync(payUrl);
                    }
                } else {
                    // Open the payment URL in the in-app browser (SePay VietQR or ZaloPay web fallback)
                    setState({
                        phase: "waiting",
                        orderId,
                        amountVnd,
                        provider,
                    });
                    pollStatus(orderId);
                    await WebBrowser.openBrowserAsync(payUrl);
                    // User closed the browser — if still pending, stop polling and go back to idle
                    stopPolling();
                    setState((prev) => {
                        if (prev.phase === "waiting") {
                            return { phase: "idle" };
                        }
                        return prev;
                    });
                }
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
