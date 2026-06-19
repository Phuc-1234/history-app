import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppDispatch } from "@/store/storeHook";
import { setProfile } from "@/features/auth/store/authSlice";
import {
    useVerifyOtpMutation,
    useResendOtpMutation,
} from "../services/authApi";

export function useRegisterOtp(
    email: string,
    autoSend?: boolean,
    length: number = 8,
) {
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Core state configurations scaled up matching Supabase 8-digit criteria
    const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
    const [otpError, setOtpError] = useState<string | null>(null);
    const [otpCountdown, setOtpCountdown] = useState<number>(60);

    const refs = useRef<Array<any>>([]);

    // Call RTK Query mutations
    const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
    const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

    const isLoading = isVerifying || isResending;

    // Auto-focus first input box when screen loads
    useEffect(() => {
        const timer = setTimeout(() => refs.current[0]?.focus(), 100);
        return () => clearTimeout(timer);
    }, []);

    // Countdown loop tracking window intervals
    useEffect(() => {
        if (otpCountdown <= 0) return;
        const interval = setInterval(() => {
            setOtpCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [otpCountdown]);

    // Format countdown seconds into readable standard mm:ss
    const formatCountdown = useCallback(() => {
        const mins = Math.floor(otpCountdown / 60);
        const secs = otpCountdown % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }, [otpCountdown]);

    const handleOtpChange = useCallback((value: string, index: number) => {
        const clean = value.replace(/[^0-9]/g, "");

        // Handle copy-paste of multiple digits
        if (clean.length - otp[index].length > 1) {
            let pasted = clean;
            if (otp[index] && clean.startsWith(otp[index])) {
                pasted = clean.slice(otp[index].length);
            } else if (otp[index] && clean.endsWith(otp[index])) {
                pasted = clean.slice(0, -otp[index].length);
            }

            const next = [...otp];
            for (let i = 0; i < pasted.length && index + i < length; i++) {
                next[index + i] = pasted[i];
            }
            setOtp(next);

            const focusIndex = Math.min(index + pasted.length - 1, length - 1);
            refs.current[focusIndex]?.focus();
            return;
        }

        const next = [...otp];
        next[index] = clean ? clean[clean.length - 1] : "";
        setOtp(next);

        // Dynamic Focus adjustments based on length
        if (clean && index < length - 1) {
            refs.current[index + 1]?.focus();
        }
    }, [otp, length]);

    const handleOtpKeyPress = useCallback((e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    }, [otp]);

    const handleVerifyOtp = useCallback(async () => {
        const fullTokenCode = otp.join("");
        setOtpError(null);

        if (fullTokenCode.length < length) {
            setOtpError(`Vui lòng nhập đầy đủ mã ${length} số OTP.`);
            return;
        }

        try {
            const response = await verifyOtp({
                email: email.trim().toLowerCase(),
                token: fullTokenCode,
            }).unwrap();

            if ("error" in response) {
                setOtpError(response.error);
                return;
            }

            if ("session" in response && response.session) {
                if (Platform.OS === "web") {
                    try {
                        localStorage.setItem(
                            "access_token",
                            response.session.accessToken,
                        );
                        localStorage.setItem(
                            "refresh_token",
                            response.session.refreshToken,
                        );
                    } catch (e) {
                        console.error("localStorage setItem failed:", e);
                    }
                }
                await AsyncStorage.multiSet([
                    ["access_token", response.session.accessToken],
                    ["refresh_token", response.session.refreshToken],
                ]);
                dispatch(setProfile(response.profile));
            }

            router.replace("/(tabs)/2_1_lessons");
        } catch (error: any) {
            const backendError =
                error?.data?.error || "Mã xác thực không chính xác.";
            setOtpError(backendError);
        }
    }, [otp, email, verifyOtp, router, length, dispatch]);

    const handleResendOtp = useCallback(async () => {
        if (otpCountdown > 0 || isLoading) return;

        try {
            const response = await resendOtp({
                email: email.trim().toLowerCase(),
            }).unwrap();

            if ("error" in response) {
                Alert.alert("Lỗi", response.error);
                return;
            }

            Alert.alert(
                "Đã gửi lại",
                "Mã xác thực mới đã được chuyển tới email của bạn.",
            );

            setOtp(Array(length).fill(""));
            setOtpCountdown(60);
            setOtpError(null);
        } catch (error: any) {
            const backendMsg =
                error?.data?.error || "Không thể gửi lại mã vào lúc này.";
            Alert.alert("Lỗi hệ thống", backendMsg);
        }
    }, [email, otpCountdown, isLoading, resendOtp, length]);

    useEffect(() => {
        if (autoSend && email) {
            const triggerSilentResend = async () => {
                try {
                    await resendOtp({
                        email: email.trim().toLowerCase(),
                    }).unwrap();
                    Alert.alert(
                        "Xác thực",
                        "Một mã kích hoạt mới vừa được gửi tới email của bạn.",
                    );
                } catch (error) {
                    console.error(
                        "Failed to auto-resend on unverified intercept:",
                        error,
                    );
                }
            };
            triggerSilentResend();
        }
    }, []);

    return {
        otp,
        setOtp,
        otpError,
        otpCountdown,
        isLoading,
        refs,
        handleOtpChange,
        handleOtpKeyPress,
        handleVerifyOtp,
        handleResendOtp,
        formatCountdown,
    };
}
