// hooks/useAuthForm.tsx
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useLoginMutation, useGoogleVerifyMutation, useFacebookVerifyMutation } from "../services/authApi";
import { useAppDispatch } from "@/store/storeHook"; // Standard typed useDispatch hook
import { setProfile } from "@/features/auth/store/authSlice";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
    const [facebookVerify, { isLoading: isFacebookLoading }] = useFacebookVerifyMutation();

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
                if (Platform.OS === "web") {
                    try {
                        localStorage.setItem("access_token", response.session.accessToken);
                        localStorage.setItem("refresh_token", response.session.refreshToken);
                    } catch (e) {
                        console.error("localStorage setItem failed:", e);
                    }
                }
                await AsyncStorage.multiSet([
                    ["access_token", response.session.accessToken],
                    ["refresh_token", response.session.refreshToken],
                ]);
                dispatch(setProfile(response.profile));
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
                if (Platform.OS === "web") {
                    try {
                        localStorage.setItem("access_token", response.session.accessToken);
                        localStorage.setItem("refresh_token", response.session.refreshToken);
                    } catch (e) {
                        console.error("localStorage setItem failed:", e);
                    }
                }
                await AsyncStorage.multiSet([
                    ["access_token", response.session.accessToken],
                    ["refresh_token", response.session.refreshToken],
                ]);
                dispatch(setProfile(response.profile));
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

    const handleFacebookLogin = useCallback(async () => {
        try {
            const { LoginManager, AccessToken } = require("react-native-fbsdk-next");
            
            const result = await LoginManager.logInWithPermissions(["public_profile"]);
            if (result.isCancelled) {
                return;
            }

            const data = await AccessToken.getCurrentAccessToken();
            if (!data) {
                Alert.alert("Lỗi", "Không lấy được Facebook Access Token.");
                return;
            }

            const accessToken = data.accessToken;
            const response = await facebookVerify({ accessToken }).unwrap();

            if (response.status === "error") {
                Alert.alert("Lỗi đăng nhập", response.error);
                return;
            }

            if ("session" in response && response.session) {
                if (Platform.OS === "web") {
                    try {
                        localStorage.setItem("access_token", response.session.accessToken);
                        localStorage.setItem("refresh_token", response.session.refreshToken);
                    } catch (e) {
                        console.error("localStorage setItem failed:", e);
                    }
                }
                await AsyncStorage.multiSet([
                    ["access_token", response.session.accessToken],
                    ["refresh_token", response.session.refreshToken],
                ]);
                dispatch(setProfile(response.profile));
                router.replace("/(tabs)/2_1_lessons");
            }
        } catch (error: any) {
            console.error("Facebook Sign-in attempt failure:", error);
            Alert.alert("Đăng nhập Facebook thất bại", error.message || "Đã xảy ra lỗi.");
        }
    }, [facebookVerify, router]);

    const enterAsGuest = useCallback(() => {
        router.replace("/(tabs)/2_1_lessons");
    }, [router]);

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoading: isLoading || isGoogleLoading || isFacebookLoading,
        isGoogleLoading,
        isFacebookLoading,
        handleGoogleLogin,
        handleFacebookLogin,
        navigateToRegister,
        navigateToLogin,
        submitAndEnterApp,
        enterAsGuest,
    };
}

export default useAuthForm;
