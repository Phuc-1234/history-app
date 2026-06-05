// hooks/useAuthForm.tsx
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useLoginMutation } from "../services/authApi";
import { useAppDispatch } from "@/store/storeHook"; // Standard typed useDispatch hook
import { setProfile } from "@/features/auth/store/authSlice";
import { Alert } from "react-native";

export function useAuthForm() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [login, { isLoading }] = useLoginMutation();

    // Local form element bindings
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigateToRegister = useCallback(() => {
        router.push("/(1_auth)/1_2_register");
    }, [router]);

    const navigateToLogin = useCallback(() => {
        router.push("/(1_auth)/1_1_login");
    }, [router]);

    const submitAndEnterApp = useCallback(async () => {
        if (!email || !password) {
            Alert.alert(
                "Thiếu thông tin",
                "Vui lòng nhập đầy đủ email và mật khẩu.",
            );
            return;
        }

        try {
            const response = await login({ email, password }).unwrap();

            // 1. Handle Unverified Status
            if (response.status === "requires_verification") {
                router.push({
                    pathname: "/(1_auth)/1_6_otp_confirm",
                    params: {
                        email: email.trim().toLowerCase(),
                        autoSend: "true",
                    },
                });
                return;
            }

            // 2. Handle Explicit Error status (if backend returns errors as 200 status codes)
            if (response.status === "error") {
                Alert.alert("Lỗi đăng nhập", response.error);
                return;
            }
            // 3. Handle Clean Success Destination Routing
            if ("session" in response && response.session) {
                router.replace("/(tabs)/2_1_lessons");
                return;
            }
        } catch (error: any) {
            console.error("Login attempt failure:", error);

            // Fallback for standard 4xx/5xx HTTP server rejections
            if (error?.data?.requiresVerification) {
                router.push({
                    pathname: "/(1_auth)/1_6_otp_confirm",
                    params: {
                        email: email.trim().toLowerCase(),
                        autoSend: "true",
                    },
                });
                return;
            }

            const errorMessage =
                error?.data?.error ||
                "Tài khoản hoặc mật khẩu không chính xác.";
            Alert.alert("Đăng nhập thất bại", errorMessage);
        }
    }, [email, password, login, router]);

    const enterAsGuest = useCallback(() => {
        router.replace("/(tabs)/2_1_lessons");
    }, [router]);

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        navigateToRegister,
        navigateToLogin,
        submitAndEnterApp,
        enterAsGuest,
    };
}

export default useAuthForm;
