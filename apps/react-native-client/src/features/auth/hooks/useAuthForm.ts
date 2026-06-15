// hooks/useAuthForm.tsx
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useLoginMutation, useGoogleVerifyMutation } from "../services/authApi";
import { useAppDispatch } from "@/store/storeHook"; // Standard typed useDispatch hook
import { setProfile } from "@/features/auth/store/authSlice";
import { Alert } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Configure Google Sign-In client options
console.log("Configuring Google Sign-in with webClientId:", process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com",
    offlineAccess: true,
});

export function useAuthForm() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [login, { isLoading }] = useLoginMutation();
    const [googleVerify, { isLoading: isGoogleLoading }] = useGoogleVerifyMutation();

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

    const handleGoogleLogin = useCallback(async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            if (userInfo.type !== "success") {
                return;
            }
            const idToken = userInfo.data.idToken;
            if (!idToken) {
                Alert.alert("Lỗi", "Không lấy được Google ID Token.");
                return;
            }

            const response = await googleVerify({ idToken }).unwrap();

            if (response.status === "error") {
                Alert.alert("Lỗi đăng nhập", response.error);
                return;
            }

            if ("session" in response && response.session) {
                router.replace("/(tabs)/2_1_lessons");
            }
        } catch (error: any) {
            console.error("Google Sign-in attempt failure:", error);
            console.error("Error details:", {
                code: error.code,
                message: error.message,
                keys: Object.keys(error || {}),
                raw: error
            });
            if (error.code !== "SIGN_IN_CANCELLED") {
                Alert.alert("Đăng nhập Google thất bại", error.message || "Đã xảy ra lỗi.");
            }
        }
    }, [googleVerify, router]);

    const enterAsGuest = useCallback(() => {
        router.replace("/(tabs)/2_1_lessons");
    }, [router]);

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoading: isLoading || isGoogleLoading,
        isGoogleLoading,
        handleGoogleLogin,
        navigateToRegister,
        navigateToLogin,
        submitAndEnterApp,
        enterAsGuest,
    };
}

export default useAuthForm;
