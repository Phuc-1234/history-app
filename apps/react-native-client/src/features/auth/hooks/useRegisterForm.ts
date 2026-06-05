// features/auth/hooks/useRegisterForm.ts
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useRegisterUserMutation } from "../services/authApi";
import { Alert } from "react-native";

export default function useRegisterForm() {
    const router = useRouter();
    const [registerUser, { isLoading }] = useRegisterUserMutation();

    // Form Field States
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    const navigateToLogin = useCallback(() => {
        router.push("/(1_auth)/1_1_login");
    }, [router]);

    const handleRegister = useCallback(async () => {
        setFormError(null);

        // Simple Frontend Validation Safeguards
        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
            setFormError("Vui lòng nhập đầy đủ tất cả các trường.");
            return;
        }

        if (password !== confirmPassword) {
            setFormError("Mật khẩu xác nhận không khớp.");
            return;
        }

        if (password.length < 6) {
            setFormError("Mật khẩu phải chứa ít nhất 6 ký tự.");
            return;
        }

        try {
            const payload = {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                confirmPassword,
            };

            // unwrap() extracts the direct success data or throws if it's an error status
            const response = await registerUser(payload).unwrap();

            if ("error" in response) {
                setFormError(response.error);
                return;
            }

            // Route to your updated 8-digit OTP screen passing along the target email parameter context
            router.push({
                pathname: "/(1_auth)/1_6_otp_confirm",
                params: { email: email.trim().toLowerCase() },
            });
            
        } catch (err: any) {
            console.error("Registration dispatch error:", err);
            const backendError = err?.data?.error || "Đăng ký thất bại. Vui lòng thử lại.";
            setFormError(backendError);
        }
    }, [name, email, password, confirmPassword, registerUser, router]);

    return {
        name,
        setName,
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        formError,
        isLoading,
        navigateToLogin,
        handleRegister,
    };
}