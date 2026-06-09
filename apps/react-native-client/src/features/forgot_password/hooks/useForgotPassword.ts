import { useEffect, useRef, useState, useCallback } from "react";
import { router } from "expo-router";
import { Alert } from "react-native";
import {
    useForgotPasswordMutation,
    useVerifyForgotOtpMutation,
    useCompleteResetMutation,
} from "@/features/auth/services/authApi";

const OTP_LENGTH = 6;
const INITIAL_COUNTDOWN = 60;

const message = {
    emailRequired: "Vui lòng nhập email.",
    emailInvalid: "Email không đúng định dạng.",
    otpRequired: (length: number) => `Vui lòng nhập đầy đủ mã ${length} số OTP.`,
    otpInvalid: "Mã OTP không đúng hoặc đã hết hạn.",
    passwordRequired: "Vui lòng nhập mật khẩu mới.",
    passwordWeak: "Mật khẩu cần ít nhất 6 ký tự.",
    confirmRequired: "Vui lòng xác nhận mật khẩu mới.",
    confirmMismatch: "Mật khẩu xác nhận không khớp.",
};

export function useForgotPassword(initialEmail = "", initialToken = "", length = OTP_LENGTH) {
    const [email, setEmail] = useState(initialEmail);
    const [emailError, setEmailError] = useState("");
    const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
    const [otpError, setOtpError] = useState("");
    const [otpCountdown, setOtpCountdown] = useState(INITIAL_COUNTDOWN);
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [newPasswordError, setNewPasswordError] = useState("");
    const [newPasswordConfirmError, setNewPasswordConfirmError] = useState("");

    const [forgotPassword, { isLoading: isSendingForgotPassword }] = useForgotPasswordMutation();
    const [verifyForgotOtp, { isLoading: isVerifyingOtp }] = useVerifyForgotOtpMutation();
    const [completeReset, { isLoading: isCompletingReset }] = useCompleteResetMutation();

    const isLoading = isSendingForgotPassword || isVerifyingOtp || isCompletingReset;

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (otpCountdown <= 0) return;
        timerRef.current = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [otpCountdown]);

    const hasMinLength = newPassword.length >= 6;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    const handleSendOtp = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setEmailError(message.emailRequired);
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setEmailError(message.emailInvalid);
            return false;
        }
        setEmailError("");
        try {
            await forgotPassword({ email: trimmedEmail }).unwrap();
            router.push({ pathname: "/(1_auth)/1_4_otp_forgot", params: { email: trimmedEmail } });
            return true;
        } catch (error: any) {
            const backendError = error?.data?.error || "Không thể gửi mã xác thực vào lúc này.";
            setEmailError(backendError);
            return false;
        }
    };

    const handleVerifyOtp = async () => {
        const fullOtp = otp.join("");
        if (fullOtp.length < length) {
            setOtpError(message.otpRequired(length));
            return false;
        }
        setOtpError("");
        try {
            const response = await verifyForgotOtp({
                email: email.trim().toLowerCase(),
                token: fullOtp,
            }).unwrap();

            router.push({
                pathname: "/(1_auth)/1_5_new_pass_forgot",
                params: { email: email.trim().toLowerCase(), token: response.accessToken },
            });
            return true;
        } catch (error: any) {
            const backendError = error?.data?.error || message.otpInvalid;
            setOtpError(backendError);
            return false;
        }
    };

    const handleResendOtp = async () => {
        if (otpCountdown > 0 || isLoading) return false;
        try {
            await forgotPassword({ email: email.trim().toLowerCase() }).unwrap();
            setOtp(Array(length).fill(""));
            setOtpError("");
            setOtpCountdown(INITIAL_COUNTDOWN);
            Alert.alert("Gửi lại mã", "Mã xác thực mới đã được chuyển tới email của bạn.");
            return true;
        } catch (error: any) {
            const backendError = error?.data?.error || "Không thể gửi lại mã vào lúc này.";
            Alert.alert("Lỗi", backendError);
            return false;
        }
    };

    const handleResetPassword = async () => {
        let valid = true;
        if (!newPassword) {
            setNewPasswordError(message.passwordRequired);
            valid = false;
        } else if (!hasMinLength) {
            setNewPasswordError(message.passwordWeak);
            valid = false;
        } else {
            setNewPasswordError("");
        }

        if (!newPasswordConfirm) {
            setNewPasswordConfirmError(message.confirmRequired);
            valid = false;
        } else if (newPasswordConfirm !== newPassword) {
            setNewPasswordConfirmError(message.confirmMismatch);
            valid = false;
        } else {
            setNewPasswordConfirmError("");
        }

        if (!valid) return false;

        try {
            await completeReset({
                token: initialToken,
                newPassword,
            }).unwrap();
            router.replace("/(1_auth)/1_1_login");
            return true;
        } catch (error: any) {
            const backendError = error?.data?.error || "Không thể đặt lại mật khẩu vào lúc này.";
            setNewPasswordError(backendError);
            return false;
        }
    };

    const formatCountdown = () => {
        const minutes = Math.floor(otpCountdown / 60).toString().padStart(2, "0");
        const seconds = (otpCountdown % 60).toString().padStart(2, "0");
        return minutes + ":" + seconds;
    };

    return {
        email,
        setEmail,
        emailError,
        otp,
        setOtp,
        otpError,
        otpCountdown,
        newPassword,
        setNewPassword,
        newPasswordConfirm,
        setNewPasswordConfirm,
        newPasswordError,
        newPasswordConfirmError,
        isLoading,
        hasMinLength,
        hasUppercase,
        hasNumber,
        handleSendOtp,
        handleVerifyOtp,
        handleResendOtp,
        handleResetPassword,
        formatCountdown,
    };
}
