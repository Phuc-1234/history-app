import { useState, useRef, useCallback, useEffect } from "react";
import { Linking, AppState } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
    useInitiateSubscriptionMutation,
    useCancelSubscriptionMutation,
    paymentApi,
    GetSubscriptionStatusResponse,
    PaymentProvider
} from "../api/paymentApi";
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

type SubscriptionPaymentState =
    | { phase: "idle" }
    | { phase: "loading" }
    | {
          phase: "waiting";
          orderId: string;
          payUrl?: string;
          zpTransToken?: string;
          vietQrUrl?: string;
          bankId?: string;
          accountNo?: string;
          accountName?: string;
          providerOrderId?: string;
          amountVnd: number;
          provider: PaymentProvider;
      }
    | { phase: "success"; result: any }
    | { phase: "failed"; error: string };

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS_DEFAULT = 150; // 5 minutes max cho VietQR / SePay
const POLL_MAX_ATTEMPTS_ZALOPAY = 30; // 60 seconds (1 phút) max cho ZaloPay

export function useSubscriptionPayment() {
    const [state, setState] = useState<SubscriptionPaymentState>({ phase: "idle" });
    const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const attemptsRef = useRef(0);
    const currentOrderIdRef = useRef<string | null>(null);
    const currentProviderRef = useRef<PaymentProvider | null>(null);

    const dispatch = useDispatch<AppDispatch>();
    const [initiateSubscription] = useInitiateSubscriptionMutation();
    const [cancelSubMutation] = useCancelSubscriptionMutation();

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
                    paymentApi.endpoints.getSubscriptionStatus.initiate(orderId, { forceRefetch: true }),
                ).unwrap();

                if (currentOrderIdRef.current !== orderId) return false;

                if (result.status === "ACTIVE") {
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
                    setState({ phase: "failed", error: "Đăng ký gói thất bại hoặc đã bị hủy." });
                    return true;
                }
            } catch (err) {
                console.warn("[ZaloPay Subscription] Immediate check error:", err);
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
                        ? "Đăng ký qua ZaloPay quá thời gian chờ (60s). Vui lòng kiểm tra lại ứng dụng ZaloPay hoặc thử lại."
                        : "Hết thời gian chờ xác nhận thanh toán.";
                setState({ phase: "failed", error: timeoutError });
                return;
            }

            try {
                const result = await dispatch(
                    paymentApi.endpoints.getSubscriptionStatus.initiate(orderId, { forceRefetch: true }),
                ).unwrap();

                if (currentOrderIdRef.current !== orderId) return;

                if (result.status === "ACTIVE") {
                    stopPolling();
                    try {
                        WebBrowser.dismissBrowser();
                    } catch (e) {
                        console.warn("[WebBrowser] dismiss failed:", e);
                    }
                    // Refetch user profile so they immediately see the PRO badge
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
                    setState({ phase: "failed", error: "Đăng ký gói thất bại hoặc đã bị hủy." });
                    return;
                }

                // Still PENDING — poll again if currentOrderId hasn't been cancelled/reset
                if (currentOrderIdRef.current === orderId) {
                    pollingRef.current = setTimeout(() => pollStatus(orderId, provider), POLL_INTERVAL_MS);
                }
            } catch {
                // Network error — poll again if currentOrderId hasn't been cancelled/reset
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
                console.log("[ZaloPay Subscription] User returned to app, checking status immediately...");
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
                console.log("[ZaloPay Subscription DeepLink] Returned via URL scheme:", event.url);
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

    const subscribe = useCallback(
        async (provider: PaymentProvider, packageId?: string) => {
            setState({ phase: "loading" });
            stopPolling();
            attemptsRef.current = 0;

            try {
                const initRes = await initiateSubscription({ provider, packageId }).unwrap();
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
                        zpTransToken,
                        amountVnd,
                        provider,
                    });
                    pollStatus(orderId, provider);

                    if (zpTransToken && ReactNativeZalopay) {
                        try {
                            console.log("[ZaloPay Subscription] Initiating native payment flow with token:", zpTransToken);
                            ReactNativeZalopay.init(2554, true);
                            const result = await ReactNativeZalopay.payOrder(zpTransToken);
                            console.log("[ZaloPay Subscription] Native result:", result);

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
                            console.warn("[ZaloPay Subscription] SDK error, falling back to direct intent:", sdkError);
                        }
                    }

                    // Direct Android Package Intent to open ZaloPay app directly without Chrome/Web
                    if (zpTransToken) {
                        try {
                            const directIntent = `intent://app.zalopay.vn/pay?zptranstoken=${zpTransToken}#Intent;scheme=zalopay;package=vn.com.vng.zalopay;end`;
                            console.log("[ZaloPay Subscription] Triggering direct package intent:", directIntent);
                            const canOpen = await Linking.canOpenURL(directIntent).catch(() => true);
                            if (canOpen) {
                                await Linking.openURL(directIntent);
                                return;
                            }
                        } catch (intentErr) {
                            console.warn("[ZaloPay Subscription] Direct intent failed, fallback to payUrl:", intentErr);
                        }
                    }

                    try {
                        await Linking.openURL(payUrl);
                    } catch (e) {
                        console.warn("[ZaloPay Subscription] Linking error, falling back to WebBrowser:", e);
                        const browserRes = await WebBrowser.openBrowserAsync(payUrl);
                        if (browserRes.type === "cancel" || browserRes.type === "dismiss") {
                            await checkStatusImmediately(orderId);
                        }
                    }
                } else {
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
                    "Không thể đăng ký gói. Vui lòng thử lại.";
                setState({ phase: "failed", error: message });
            }
        },
        [initiateSubscription, pollStatus, stopPolling, checkStatusImmediately],
    );

    const cancelSubscription = useCallback(async () => {
        setState({ phase: "loading" });
        try {
            await cancelSubMutation().unwrap();
            dispatch(apiSlice.util.invalidateTags(["User"]));
            setState({ phase: "idle" });
            return { success: true };
        } catch (error: any) {
            const message = error?.data?.error || error?.message || "Không thể hủy gói. Vui lòng thử lại.";
            setState({ phase: "failed", error: message });
            return { success: false, error: message };
        }
    }, [cancelSubMutation, dispatch]);

    const resumePayment = useCallback(async () => {
        if (state.phase !== "waiting") return;

        const zpToken = state.zpTransToken;
        const payUrl = state.payUrl;

        // For ZaloPay: re-use native SDK or direct Android intent (same flow as subscribe)
        if (state.provider === "ZALOPAY") {
            // Try native ZaloPay SDK first
            if (zpToken && ReactNativeZalopay) {
                try {
                    console.log("[Subscription Hook] Resuming via ZaloPay SDK:", zpToken);
                    ReactNativeZalopay.init(2554, true);
                    const result = await ReactNativeZalopay.payOrder(zpToken);
                    console.log("[Subscription Hook] ZaloPay SDK resume result:", result);
                    if (result.status === "cancelled") {
                        stopPolling();
                        setState({ phase: "failed", error: "Giao dịch đã bị hủy." });
                    } else if (result.status === "error") {
                        stopPolling();
                        setState({ phase: "failed", error: `Lỗi thanh toán ZaloPay: ${result.errorCode || "Unknown"}` });
                    } else if (result.status === "success") {
                        await checkStatusImmediately(state.orderId);
                    }
                    return;
                } catch (sdkError) {
                    console.warn("[Subscription Hook] ZaloPay SDK resume failed, trying direct intent:", sdkError);
                }
            }

            // Fallback: direct Android package intent to open ZaloPay app
            if (zpToken) {
                try {
                    const directIntent = `intent://app.zalopay.vn/pay?zptranstoken=${zpToken}#Intent;scheme=zalopay;package=vn.com.vng.zalopay;end`;
                    console.log("[Subscription Hook] Resuming via direct intent:", directIntent);
                    await Linking.openURL(directIntent);
                    return;
                } catch (intentErr) {
                    console.warn("[Subscription Hook] Direct intent resume failed, fallback to payUrl:", intentErr);
                }
            }

            // Last resort: open payUrl via Linking (opens ZaloPay if installed, else web)
            if (payUrl) {
                try {
                    await Linking.openURL(payUrl);
                } catch (e) {
                    console.error("[Subscription Hook] Linking resume failed:", e);
                }
            }
            return;
        }

        // For non-ZaloPay providers: open via WebBrowser
        if (!payUrl) return;
        try {
            console.log("[Subscription Hook] Resuming payment for payUrl:", payUrl);
            await WebBrowser.openBrowserAsync(payUrl);
        } catch (e) {
            console.warn("[Subscription Hook] WebBrowser resume failed, fallback to Linking:", e);
            try {
                await Linking.openURL(payUrl);
            } catch (linkErr) {
                console.error("[Subscription Hook] Linking resume failed:", linkErr);
            }
        }
    }, [state, checkStatusImmediately, stopPolling]);

    const reset = useCallback(() => {
        stopPolling();
        attemptsRef.current = 0;
        currentOrderIdRef.current = null;
        currentProviderRef.current = null;
        setState({ phase: "idle" });
    }, [stopPolling]);

    return { state, subscribe, resumePayment, cancelSubscription, reset };
}

