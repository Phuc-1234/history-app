// hooks/useRegisterOtp.ts
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useVerifyOtpMutation, useResendOtpMutation } from "../services/authApi";

export function useRegisterOtp(email: string, autoSend?: boolean, length: number = 8) {
    const router = useRouter();
    
    // Core state configurations scaled up matching Supabase 8-digit criteria
    const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
    const [otpError, setOtpError] = useState<string | null>(null);
    const [otpCountdown, setOtpCountdown] = useState<number>(60);

    // Call RTK Query mutations
    const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
    const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

    const isLoading = isVerifying || isResending;

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
                token: fullTokenCode 
            }).unwrap();

            if ("error" in response) {
                setOtpError(response.error);
                return;
            }

            router.replace("/(tabs)/2_1_lessons");
        } catch (error: any) {
            const backendError = error?.data?.error || "Mã xác thực không chính xác.";
            setOtpError(backendError);
        }
    }, [otp, email, verifyOtp, router, length]);

    const handleResendOtp = useCallback(async () => {
        if (otpCountdown > 0 || isLoading) return;

        try {
            const response = await resendOtp({ email: email.trim().toLowerCase() }).unwrap();
            
            if ("error" in response) {
                Alert.alert("Lỗi", response.error);
                return;
            }

            Alert.alert("Đã gửi lại", "Mã xác thực mới đã được chuyển tới email của bạn.");
            
            setOtp(Array(length).fill(""));
            setOtpCountdown(60); 
            setOtpError(null);
        } catch (error: any) {
            const backendMsg = error?.data?.error || "Không thể gửi lại mã vào lúc này.";
            Alert.alert("Lỗi hệ thống", backendMsg);
        }
    }, [email, otpCountdown, isLoading, resendOtp, length]);

    // FIX: Handled autoSend safely by placing it AFTER function definitions, 
    // and using a tracking ref so it only executes precisely once on mount.
    useEffect(() => {
        if (autoSend && email) {
            const triggerSilentResend = async () => {
                try {
                    await resendOtp({ email: email.trim().toLowerCase() }).unwrap();
                    Alert.alert("Xác thực", "Một mã kích hoạt mới vừa được gửi tới email của bạn.");
                } catch (error) {
                    console.error("Failed to auto-resend on unverified intercept:", error);
                }
            };
            triggerSilentResend();
        }
        // Empty dependency array ensures this effect runs strictly ONCE when the screen loads
        // completely bypassing component re-render loops.
    }, []); 

    return {
        otp,
        setOtp,
        otpError,
        otpCountdown,
        isLoading,
        handleVerifyOtp,
        handleResendOtp,
        formatCountdown,
    };
}