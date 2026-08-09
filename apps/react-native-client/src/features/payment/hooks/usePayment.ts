// features/payment/hooks/usePayment.ts
import { useState, useRef, useCallback, useEffect } from "react";
import { Linking, AppState } from "react-native";
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
          payUrl?: string;
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
const POLL_MAX_ATTEMPTS_DEFAULT = 150; // 300 seconds (5 phút) max cho SePay / VietQR
const POLL_MAX_ATTEMPTS_ZALOPAY = 30; // 60 seconds (1 phút) max cho ZaloPay

export function usePayment() {
    const [state, setState] = useState<PaymentState>({ phase: "idle" });
    const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const attemptsRef = useRef(0);
    const currentOrderIdRef = useRef<string | null>(null);
    const currentProviderRef = useRef<PaymentProvider | null>(null);

    const dispatch = useDispatch<AppDispatch>();
    const [initiatePayment] = useInitiatePaymentMutation();

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearTimeout(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const checkStatusImmediately = useCallback(
        async (orderId: string) => {
            if (currentOrderIdRef.current !== orderId) return false;
            try {
                const result = await dispatch(
                    paymentApi.endpoints.getPaymentStatus.initiate(orderId, { forceRefetch: true }),
                ).unwrap();

                if (currentOrderIdRef.current !== orderId) return false;

                if (result.status === "SUCCESS") {
                    stopPolling();
                    try {
                        WebBrowser.dismissBrowser();
                    } catch (e) {
                        console.warn("[WebBrowser] dismiss failed:", e);
                    }
                    dispatch(apiSlice.util.invalidateTags(["User"]));
                    setState({ phase: "success", result });
                    return true;
                }

                if (result.status === "FAILED") {
                    stopPolling();
                    try {
                        WebBrowser.dismissBrowser();
                    } catch (e) {
                        console.warn("[WebBrowser] dismiss failed:", e);
                    }
                    setState({ phase: "failed", error: "Giao dịch thất bại hoặc đã bị hủy." });
                    return true;
                }
            } catch (err) {
                console.warn("[ZaloPay] Immediate check failed:", err);
            }
            return false;
        },
        [dispatch, stopPolling],
    );

    const pollStatus = useCallback(
        async (orderId: string, provider: PaymentProvider) => {
            if (currentOrderIdRef.current !== orderId) return;
            attemptsRef.current += 1;
            const maxAttempts = provider === "ZALOPAY" ? POLL_MAX_ATTEMPTS_ZALOPAY : POLL_MAX_ATTEMPTS_DEFAULT;

            if (attemptsRef.current > maxAttempts) {
                stopPolling();
                if (currentOrderIdRef.current !== orderId) return;
                const timeoutError =
                    provider === "ZALOPAY"
                        ? "Thanh toán ZaloPay quá thời gian chờ (60s). Vui lòng kiểm tra lại ứng dụng ZaloPay hoặc thử lại."
                        : "Hết thời gian chờ xác nhận thanh toán.";
                setState({ phase: "failed", error: timeoutError });
                return;
            }

            try {
                const result = await dispatch(
                    paymentApi.endpoints.getPaymentStatus.initiate(orderId, { forceRefetch: true }),
                ).unwrap();

                if (currentOrderIdRef.current !== orderId) return;

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
                    setState({ phase: "failed", error: "Giao dịch thất bại hoặc đã bị hủy." });
                    return;
                }

                // Still PENDING — poll again if currentOrderId hasn't been cancelled/reset
                if (currentOrderIdRef.current === orderId) {
                    pollingRef.current = setTimeout(() => pollStatus(orderId, provider), POLL_INTERVAL_MS);
                }
            } catch {
                // Network error during polling — try again if currentOrderId hasn't been cancelled/reset
                if (currentOrderIdRef.current === orderId) {
                    pollingRef.current = setTimeout(() => pollStatus(orderId, provider), POLL_INTERVAL_MS);
                }
            }
        },
        [dispatch, stopPolling],
    );

    // Listen for AppState and Deep Link changes to check status instantly when user returns to app from ZaloPay
    useEffect(() => {
        const appStateSub = AppState.addEventListener("change", (nextAppState) => {
            if (
                nextAppState === "active" &&
                currentOrderIdRef.current &&
                currentProviderRef.current === "ZALOPAY"
            ) {
                console.log("[ZaloPay] User returned to app, checking payment status immediately...");
                checkStatusImmediately(currentOrderIdRef.current);
            }
        });

        const urlSub = Linking.addEventListener("url", (event) => {
            if (
                event.url &&
                event.url.includes("historyapp://") &&
                currentOrderIdRef.current &&
                currentProviderRef.current === "ZALOPAY"
            ) {
                console.log("[ZaloPay DeepLink] Returned via URL scheme:", event.url);
                try {
                    WebBrowser.dismissBrowser();
                } catch (e) {
                    console.warn("[WebBrowser] dismiss failed:", e);
                }
                checkStatusImmediately(currentOrderIdRef.current);
            }
        });

        return () => {
            appStateSub.remove();
            urlSub.remove();
        };
    }, [checkStatusImmediately]);

    const pay = useCallback(
        async (provider: PaymentProvider, goldAmount?: number, packageId?: string) => {
            setState({ phase: "loading" });
            stopPolling();
            attemptsRef.current = 0;

            try {
                const initRes = await initiatePayment({ provider, goldAmount, packageId }).unwrap();
                const { orderId, payUrl, zpTransToken, vietQrUrl, bankId, accountNo, accountName, providerOrderId, amountVnd } = initRes;

                currentOrderIdRef.current = orderId;
                currentProviderRef.current = provider;

                if (provider === "SEPAY" && vietQrUrl) {
                    setState({
                        phase: "waiting",
                        orderId,
                        payUrl,
                        vietQrUrl,
                        bankId,
                        accountNo,
                        accountName,
                        providerOrderId,
                        amountVnd,
                        provider,
                    });
                    pollStatus(orderId, provider);
                    return;
                }

                if (provider === "ZALOPAY") {
                    setState({
                        phase: "waiting",
                        orderId,
                        payUrl,
                        amountVnd,
                        provider,
                    });
                    pollStatus(orderId, provider);

                    if (zpTransToken && ReactNativeZalopay) {
                        try {
                            console.log("[ZaloPay] Initiating native payment flow with token:", zpTransToken);
                            ReactNativeZalopay.init(2554, true);

                            const result = await ReactNativeZalopay.payOrder(zpTransToken);
                            console.log("[ZaloPay] Native payment result:", result);

                            if (result.status === "cancelled") {
                                stopPolling();
                                setState({ phase: "failed", error: "Giao dịch đã bị hủy." });
                                return;
                            } else if (result.status === "error") {
                                stopPolling();
                                setState({ phase: "failed", error: `Lỗi thanh toán ZaloPay: ${result.errorCode || "Unknown"}` });
                                return;
                            } else if (result.status === "success") {
                                await checkStatusImmediately(orderId);
                                return;
                            }
                        } catch (sdkError: any) {
                            console.warn("[ZaloPay] Native module error, falling back to direct intent:", sdkError);
                        }
                    }

                    // Direct Android Package Intent to open ZaloPay app directly without Chrome/Web
                    if (zpTransToken) {
                        try {
                            const directIntent = `intent://app.zalopay.vn/pay?zptranstoken=${zpTransToken}#Intent;scheme=zalopay;package=vn.com.vng.zalopay;end`;
                            console.log("[ZaloPay] Triggering direct package intent to ZaloPay app:", directIntent);
                            const canOpen = await Linking.canOpenURL(directIntent).catch(() => true);
                            if (canOpen) {
                                await Linking.openURL(directIntent);
                                return;
                            }
                        } catch (intentErr) {
                            console.warn("[ZaloPay] Direct intent failed, fallback to payUrl:", intentErr);
                        }
                    }

                    try {
                        await Linking.openURL(payUrl);
                    } catch (err) {
                        console.warn("[ZaloPay] Linking.openURL failed:", err);
                        const browserRes = await WebBrowser.openBrowserAsync(payUrl);
                        if (browserRes.type === "cancel" || browserRes.type === "dismiss") {
                            await checkStatusImmediately(orderId);
                        }
                    }
                } else {
                    // Open the payment URL in the in-app browser (SePay VietQR or web fallback)
                    setState({
                        phase: "waiting",
                        orderId,
                        amountVnd,
                        provider,
                    });
                    pollStatus(orderId, provider);
                    const browserRes = await WebBrowser.openBrowserAsync(payUrl);
                    if (browserRes.type === "cancel" || browserRes.type === "dismiss") {
                        await checkStatusImmediately(orderId);
                    }
                }
            } catch (error: any) {
                const message =
                    error?.data?.error ||
                    error?.message ||
                    "Không thể tạo đơn thanh toán. Vui lòng thử lại.";
                setState({ phase: "failed", error: message });
            }
        },
        [initiatePayment, pollStatus, stopPolling, checkStatusImmediately],
    );

    const resumePayment = useCallback(async () => {
        if (state.phase !== "waiting" || !state.payUrl) return;
        try {
            console.log("[Payment Hook] Resuming payment for payUrl:", state.payUrl);
            await WebBrowser.openBrowserAsync(state.payUrl);
        } catch (e) {
            console.warn("[Payment Hook] WebBrowser resume failed, fallback to Linking:", e);
            try {
                await Linking.openURL(state.payUrl);
            } catch (linkErr) {
                console.error("[Payment Hook] Linking resume failed:", linkErr);
            }
        }
    }, [state]);

    const reset = useCallback(() => {
        stopPolling();
        attemptsRef.current = 0;
        currentOrderIdRef.current = null;
        currentProviderRef.current = null;
        setState({ phase: "idle" });
    }, [stopPolling]);

    return { state, pay, resumePayment, reset };
}

