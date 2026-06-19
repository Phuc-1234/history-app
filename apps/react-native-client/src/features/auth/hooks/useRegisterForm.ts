import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useRegisterUserMutation } from "../services/authApi";

export default function useRegisterForm() {
    const router = useRouter();
    const [registerUser, { isLoading }] = useRegisterUserMutation();

    // Form Field States
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    // Validation States
    const [nameError, setNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");

    const navigateToLogin = useCallback(() => {
        router.push("/(1_auth)/1_1_login");
    }, [router]);

    const handleRegister = useCallback(async () => {
        setFormError(null);

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

            const response = await registerUser(payload).unwrap();

            if ("error" in response) {
                setFormError(response.error);
                return;
            }

            router.push({
                pathname: "/(1_auth)/1_6_otp_confirm",
                params: { email: email.trim().toLowerCase() },
            });
        } catch (err: any) {
            console.error("Registration dispatch error:", err);
            const backendError =
                err?.data?.error || "Đăng ký thất bại. Vui lòng thử lại.";
            setFormError(backendError);
        }
    }, [name, email, password, confirmPassword, registerUser, router]);

    const handleRegisterSubmit = useCallback(async () => {
        const cleanName = name.trim();
        const cleanEmail = email.trim();
        let hasError = false;

        // 1. Kiểm tra ô Tên
        if (!cleanName) {
            setNameError("Bạn chưa nhập tên!");
            hasError = true;
        } else {
            setNameError("");
        }

        // 2. Kiểm tra ô Email
        if (!cleanEmail) {
            setEmailError("Vui lòng nhập email!");
            hasError = true;
        } else {
            setEmailError("");
        }

        // 3. Kiểm tra ô Mật khẩu
        if (!password) {
            setPasswordError("Vui lòng nhập mật khẩu!");
            hasError = true;
        } else if (password.length < 6) {
            setPasswordError("Mật khẩu phải có ít nhất 6 ký tự!");
            hasError = true;
        } else {
            setPasswordError("");
        }

        // 4. Kiểm tra ô Xác nhận mật khẩu
        if (!confirmPassword) {
            setConfirmPasswordError("Vui lòng nhập xác nhận mật khẩu!");
            hasError = true;
        } else if (password !== confirmPassword) {
            setConfirmPasswordError("Mật khẩu xác nhận không trùng khớp!");
            hasError = true;
        } else {
            setConfirmPasswordError("");
        }

        if (hasError) return;

        let finalEmail = cleanEmail;
        if (!cleanEmail.includes("@")) {
            finalEmail = `${cleanEmail}@gmail.com`;
            setEmail(finalEmail);
        }

        try {
            const payload = {
                name: cleanName,
                email: finalEmail.toLowerCase(),
                password,
                confirmPassword,
            };

            const response = await registerUser(payload).unwrap();

            if ("error" in response) {
                setFormError(response.error);
                return;
            }

            router.push({
                pathname: "/(1_auth)/1_6_otp_confirm",
                params: { email: finalEmail.toLowerCase() },
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
        nameError,
        setNameError,
        emailError,
        setEmailError,
        passwordError,
        setPasswordError,
        confirmPasswordError,
        setConfirmPasswordError,
        isLoading,
        navigateToLogin,
        handleRegister,
        handleRegisterSubmit,
    };
}
