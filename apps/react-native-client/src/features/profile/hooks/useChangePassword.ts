import { useState } from "react";
import { router } from "expo-router";

const message = {
    currentRequired: "Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u c\u0169.",
    newRequired: "Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u m\u1edbi.",
    newMin: "M\u1eadt kh\u1ea9u m\u1edbi ph\u1ea3i c\u00f3 \u00edt nh\u1ea5t 8 k\u00fd t\u1ef1.",
    newSame: "M\u1eadt kh\u1ea9u m\u1edbi kh\u00f4ng \u0111\u01b0\u1ee3c tr\u00f9ng m\u1eadt kh\u1ea9u c\u0169.",
    confirmRequired: "Vui l\u00f2ng x\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u m\u1edbi.",
    confirmMismatch: "M\u1eadt kh\u1ea9u x\u00e1c nh\u1eadn kh\u00f4ng kh\u1edbp.",
    success: "C\u1eadp nh\u1eadt m\u1eadt kh\u1ea9u th\u00e0nh c\u00f4ng.",
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
        } else if (newPassword.length < 8) {
            setNewPasswordError(message.newMin);
            isValid = false;
        } else if (newPassword === currentPassword) {
            setNewPasswordError(message.newSame);
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
        await new Promise((resolve) => setTimeout(resolve, 400));

        setIsSuccess(true);
        setFeedbackMessage(message.success);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsLoading(false);

        setTimeout(() => {
            if (router.canGoBack()) router.back();
        }, 900);

        return true;
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
