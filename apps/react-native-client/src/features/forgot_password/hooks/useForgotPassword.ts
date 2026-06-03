import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";

const OTP_LENGTH = 6;
const INITIAL_COUNTDOWN = 60;

const message = {
    emailRequired: "Vui l\u00f2ng nh\u1eadp email.",
    emailInvalid: "Email kh\u00f4ng \u0111\u00fang \u0111\u1ecbnh d\u1ea1ng.",
    otpRequired: "Vui l\u00f2ng nh\u1eadp \u0111\u1ea7y \u0111\u1ee7 m\u00e3 OTP.",
    otpInvalid: "M\u00e3 OTP kh\u00f4ng \u0111\u00fang. T\u1ea1m th\u1eddi d\u00f9ng 123456 \u0111\u1ec3 test.",
    passwordRequired: "Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u m\u1edbi.",
    passwordWeak: "M\u1eadt kh\u1ea9u c\u1ea7n \u00edt nh\u1ea5t 8 k\u00fd t\u1ef1, 1 ch\u1eef hoa v\u00e0 1 s\u1ed1.",
    confirmRequired: "Vui l\u00f2ng x\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u m\u1edbi.",
    confirmMismatch: "M\u1eadt kh\u1ea9u x\u00e1c nh\u1eadn kh\u00f4ng kh\u1edbp.",
};

export function useForgotPassword(initialEmail = "") {
    const [email, setEmail] = useState(initialEmail);
    const [emailError, setEmailError] = useState("");
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [otpError, setOtpError] = useState("");
    const [otpCountdown, setOtpCountdown] = useState(INITIAL_COUNTDOWN);
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [newPasswordError, setNewPasswordError] = useState("");
    const [newPasswordConfirmError, setNewPasswordConfirmError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (otpCountdown <= 0) return;
        timerRef.current = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [otpCountdown]);

    const hasMinLength = newPassword.length >= 8;
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
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 400));
        setIsLoading(false);
        router.push({ pathname: "/(1_auth)/1_4_otp_forgot", params: { email: trimmedEmail } });
        return true;
    };

    const handleVerifyOtp = async () => {
        const fullOtp = otp.join("");
        if (fullOtp.length < OTP_LENGTH) {
            setOtpError(message.otpRequired);
            return false;
        }
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 400));
        setIsLoading(false);
        if (fullOtp !== "123456" && fullOtp !== "111111") {
            setOtpError(message.otpInvalid);
            return false;
        }
        setOtpError("");
        router.push({ pathname: "/(1_auth)/1_5_new_pass_forgot", params: { email, otp: fullOtp } });
        return true;
    };

    const handleResendOtp = async () => {
        if (otpCountdown > 0 || isLoading) return false;
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 400));
        setOtp(Array(OTP_LENGTH).fill(""));
        setOtpError("");
        setOtpCountdown(INITIAL_COUNTDOWN);
        setIsLoading(false);
        return true;
    };

    const handleResetPassword = async () => {
        let valid = true;
        if (!newPassword) {
            setNewPasswordError(message.passwordRequired);
            valid = false;
        } else if (!hasMinLength || !hasUppercase || !hasNumber) {
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
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 400));
        setIsLoading(false);
        router.replace("/(1_auth)/1_1_login");
        return true;
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
