import { useState } from "react";
import { router } from "expo-router";
import { useChangePasswordMutation } from "@/features/auth/services/authApi";

const message = {
    currentRequired: "Vui lòng nhập mật khẩu cũ.",
    newRequired: "Vui lòng nhập mật khẩu mới.",
    newMin: "Mật khẩu mới phải có ít nhất 6 ký tự.",
    newSame: "Mật khẩu mới không được trùng mật khẩu cũ.",
    confirmRequired: "Vui lòng xác nhận mật khẩu mới.",
    confirmMismatch: "Mật khẩu xác nhận không khớp.",
    success: "Đổi mật khẩu thành công!",
};

export function useChangePassword() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [currentPasswordError, setCurrentPasswordError] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordError, setNewPasswordError] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [changePasswordApi] = useChangePasswordMutation();

    const validateFields = () => {
        let isValid = true;

        if (!currentPassword) {
            setCurrentPasswordError(message.currentRequired);
            isValid = false;
        } else {
            setCurrentPasswordError("");
        }

        if (!newPassword) {
            setNewPasswordError(message.newRequired);
            isValid = false;
        } else if (newPassword === currentPassword) {
            // Ưu tiên báo lỗi trùng mật khẩu cũ (yêu cầu nghiệp vụ: không được nhập trùng mk cũ)
            setNewPasswordError(message.newSame);
            isValid = false;
        } else if (newPassword.length < 6) {
            setNewPasswordError(message.newMin);
            isValid = false;
        } else {
            setNewPasswordError("");
        }

        if (!confirmPassword) {
            setConfirmPasswordError(message.confirmRequired);
            isValid = false;
        } else if (confirmPassword !== newPassword) {
            setConfirmPasswordError(message.confirmMismatch);
            isValid = false;
        } else {
            setConfirmPasswordError("");
        }

        return isValid;
    };

    const handleChangePassword = async () => {
        if (!validateFields()) return false;

        setIsLoading(true);
        setFeedbackMessage("");
        
        try {
            await changePasswordApi({
                currentPassword,
                oldPassword: currentPassword,
                newPassword,
            }).unwrap();
            setIsSuccess(true);
            setFeedbackMessage(message.success);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => {
                if (router.canGoBack()) router.back();
            }, 1800);
            return true;
        } catch (err: any) {
            setIsSuccess(false);
            const rawError = err?.data?.error || err?.message || "";
            const lower = rawError.toLowerCase();
            let msg = "Cập nhật mật khẩu thất bại.";
            if (lower.includes("mật khẩu cũ không đúng") || lower.includes("invalid login credentials") || lower.includes("old password") || lower.includes("current_password") || lower.includes("incorrect")) {
                msg = "Mật khẩu cũ không đúng.";
            } else if (lower.includes("same") || lower.includes("different") || lower.includes("trùng")) {
                msg = "Mật khẩu mới không được trùng mật khẩu cũ.";
            } else if (lower.includes("short") || lower.includes("least") || lower.includes("ngắn")) {
                msg = "Mật khẩu mới phải có ít nhất 6 ký tự.";
            } else if (rawError && !lower.includes("error") && !lower.includes("failed")) {
                msg = rawError;
            }
            setFeedbackMessage(msg);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        currentPassword,
        setCurrentPassword,
        currentPasswordError,
        newPassword,
        setNewPassword,
        newPasswordError,
        confirmPassword,
        setConfirmPassword,
        confirmPasswordError,
        isLoading,
        isSuccess,
        feedbackMessage,
        handleChangePassword,
    };
}
