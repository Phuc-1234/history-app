// hooks/useAuthForm.tsx
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    useLoginMutation,
    useGoogleVerifyMutation,
    useFacebookVerifyMutation,
} from "../services/authApi";
import { useAppDispatch } from "@/store/storeHook"; // Standard typed useDispatch hook
import { setProfile } from "@/features/auth/store/authSlice";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useLoading } from "@/features/loading";

// Configure Google Sign-In client options
console.log(
    "Configuring Google Sign-in with webClientId:",
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
);
GoogleSignin.configure({
    webClientId:
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
        "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com",
    offlineAccess: true,
});

const translateAuthError = (
    rawError?: string,
    defaultMessage = "Tài khoản hoặc mật khẩu không chính xác.",
): string => {
    if (!rawError) return defaultMessage;
    const lower = rawError.toLowerCase();
    if (
        lower.includes("invalid login credentials") ||
        lower.includes("invalid email or password") ||
        lower.includes("user not found") ||
        lower.includes("invalid_grant") ||
        lower.includes("invalid credentials")
    ) {
        return "Tài khoản hoặc mật khẩu không chính xác.";
    }
    if (lower.includes("confirmed") || lower.includes("unverified")) {
        return "Email chưa được xác thực. Vui lòng kiểm tra hộp thư.";
    }
    if (
        lower.includes("already registered") ||
        lower.includes("already in use") ||
        lower.includes("already exists")
    ) {
        return "Email này đã được đăng ký tài khoản.";
    }
    if (
        lower.includes("rate") ||
        lower.includes("too many requests") ||
        lower.includes("after") ||
        lower.includes("security")
    ) {
        return "Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau ít phút.";
    }
    if (lower.includes("network") || lower.includes("fetch")) {
        return "Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.";
    }
    if (lower.includes("password must be at least") || lower.includes("weak")) {
        return "Mật khẩu phải có ít nhất 6 ký tự.";
    }
    return rawError;
};

export function useAuthForm() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showLoading, isLoading: isGlobalLoading } = useLoading();
    
    const [login, { isLoading }] = useLoginMutation();
    const [googleVerify, { isLoading: isGoogleLoading }] =
        useGoogleVerifyMutation();
    const [facebookVerify, { isLoading: isFacebookLoading }] =
        useFacebookVerifyMutation();

    // Local form element bindings
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    // Custom Error Modal State
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorModalTitle, setErrorModalTitle] = useState("");
    const [errorModalMessage, setErrorModalMessage] = useState("");

    const showErrorModal = useCallback((title: string, message: string) => {
        setErrorModalTitle(title);
        setErrorModalMessage(message);
        setErrorModalVisible(true);
    }, []);

    const closeErrorModal = useCallback(() => {
        setErrorModalVisible(false);
    }, []);

    const navigateToRegister = useCallback(() => {
        router.push("/(1_auth)/1_2_register");
    }, [router]);

    const navigateToLogin = useCallback(() => {
        router.push("/(1_auth)/1_1_login");
    }, [router]);

    const submitAndEnterApp = useCallback(async () => {
        if (!email || !password) {
            showErrorModal(
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
                showErrorModal("Lỗi đăng nhập", translateAuthError(response.error));
                return;
            }
            // 3. Handle Clean Success Destination Routing
            if ("session" in response && response.session) {
                if (Platform.OS === "web") {
                    try {
                        localStorage.setItem(
                            "access_token",
                            response.session.accessToken,
                        );
                        localStorage.setItem(
                            "refresh_token",
                            response.session.refreshToken,
                        );
                    } catch (e) {
                        console.error("localStorage setItem failed:", e);
                    }
                }
                await AsyncStorage.multiSet([
                    ["access_token", response.session.accessToken],
                    ["refresh_token", response.session.refreshToken],
                ]);
                dispatch(setProfile(response.profile));
                showLoading();
                router.replace("/(tabs)/home");
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

            const errorMessage = translateAuthError(
                error?.data?.error || error?.message,
                "Tài khoản hoặc mật khẩu không chính xác.",
            );
            showErrorModal("Đăng nhập thất bại", errorMessage);
        }
    }, [email, password, login, router, dispatch, showErrorModal, showLoading]);

    const handleLoginSubmit = useCallback(async () => {
        const cleanEmail = email.trim();
        let hasError = false;

        if (!cleanEmail) {
            setEmailError("Vui lòng nhập email hoặc số điện thoại!");
            hasError = true;
        } else {
            setEmailError("");
        }

        if (!password) {
            setPasswordError("Vui lòng nhập mật khẩu!");
            hasError = true;
        } else {
            setPasswordError("");
        }

        if (hasError) return;

        let finalEmail = cleanEmail;
        if (!cleanEmail.includes("@")) {
            finalEmail = `${cleanEmail}@gmail.com`;
            setEmail(finalEmail);
        }

        try {
            const response = await login({ email: finalEmail, password }).unwrap();

            if (response.status === "requires_verification") {
                router.push({
                    pathname: "/(1_auth)/1_6_otp_confirm",
                    params: {
                        email: finalEmail.toLowerCase(),
                        autoSend: "true",
                    },
                });
                return;
            }

            if (response.status === "error") {
                showErrorModal("Lỗi đăng nhập", translateAuthError(response.error));
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
                showLoading();
                router.replace("/(tabs)/home");
            }
        } catch (error: any) {
            console.error("Login attempt failure:", error);
            if (error?.data?.requiresVerification) {
                router.push({
                    pathname: "/(1_auth)/1_6_otp_confirm",
                    params: {
                        email: finalEmail.toLowerCase(),
                        autoSend: "true",
                    },
                });
                return;
            }
            const errorMessage = translateAuthError(
                error?.data?.error || error?.message,
                "Tài khoản hoặc mật khẩu không chính xác.",
            );
            showErrorModal("Đăng nhập thất bại", errorMessage);
        }
    }, [email, password, login, router, dispatch, showErrorModal, showLoading]);

    const handleGoogleLogin = useCallback(async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            if (userInfo.type !== "success") {
                return;
            }
            const idToken = userInfo.data.idToken;
            if (!idToken) {
                showErrorModal("Lỗi", "Không lấy được Google ID Token.");
                return;
            }

            const response = await googleVerify({ idToken }).unwrap();

            if (response.status === "error") {
                showErrorModal("Lỗi đăng nhập", translateAuthError(response.error));
                return;
            }

            if ("session" in response && response.session) {
                if (Platform.OS === "web") {
                    try {
                        localStorage.setItem(
                            "access_token",
                            response.session.accessToken,
                        );
                        localStorage.setItem(
                            "refresh_token",
                            response.session.refreshToken,
                        );
                    } catch (e) {
                        console.error("localStorage setItem failed:", e);
                    }
                }
                await AsyncStorage.multiSet([
                    ["access_token", response.session.accessToken],
                    ["refresh_token", response.session.refreshToken],
                ]);
                dispatch(setProfile(response.profile));
                showLoading();
                router.replace("/(tabs)/home");
            }
        } catch (error: any) {
            console.error("Google Sign-in attempt failure:", error);
            if (error.code !== "SIGN_IN_CANCELLED") {
                showErrorModal(
                    "Đăng nhập Google thất bại",
                    translateAuthError(error.message, "Đã xảy ra lỗi khi đăng nhập bằng Google."),
                );
            }
        }
    }, [googleVerify, router, dispatch, showErrorModal, showLoading]);

    const handleFacebookLogin = useCallback(async () => {
        try {
            const {
                LoginManager,
                AccessToken,
            } = require("react-native-fbsdk-next");

            const result = await LoginManager.logInWithPermissions([
                "public_profile",
            ]);
            if (result.isCancelled) {
                return;
            }

            const data = await AccessToken.getCurrentAccessToken();
            if (!data) {
                showErrorModal("Lỗi", "Không lấy được Facebook Access Token.");
                return;
            }

            const accessToken = data.accessToken;
            const response = await facebookVerify({ accessToken }).unwrap();

            if (response.status === "error") {
                showErrorModal("Lỗi đăng nhập", translateAuthError(response.error));
                return;
            }

            if ("session" in response && response.session) {
                if (Platform.OS === "web") {
                    try {
                        localStorage.setItem(
                            "access_token",
                            response.session.accessToken,
                        );
                        localStorage.setItem(
                            "refresh_token",
                            response.session.refreshToken,
                        );
                    } catch (e) {
                        console.error("localStorage setItem failed:", e);
                    }
                }
                await AsyncStorage.multiSet([
                    ["access_token", response.session.accessToken],
                    ["refresh_token", response.session.refreshToken],
                ]);
                dispatch(setProfile(response.profile));
                showLoading();
                router.replace("/(tabs)/home");
            }
        } catch (error: any) {
            console.error("Facebook Sign-in attempt failure:", error);
            showErrorModal(
                "Đăng nhập Facebook thất bại",
                translateAuthError(error.message, "Đã xảy ra lỗi khi đăng nhập bằng Facebook."),
            );
        }
    }, [facebookVerify, router, dispatch, showErrorModal, showLoading]);

    const enterAsGuest = useCallback(() => {
        showLoading();
        router.replace("/(tabs)/home");
    }, [router, showLoading]);

    return {
        email,
        setEmail,
        password,
        setPassword,
        emailError,
        setEmailError,
        passwordError,
        setPasswordError,
        isLoading: isLoading || isGoogleLoading || isFacebookLoading || isGlobalLoading,
        isGoogleLoading,
        isFacebookLoading,
        handleGoogleLogin,
        handleFacebookLogin,
        navigateToRegister,
        navigateToLogin,
        submitAndEnterApp,
        handleLoginSubmit,
        enterAsGuest,
        errorModalVisible,
        errorModalTitle,
        errorModalMessage,
        closeErrorModal,
    };
}

export default useAuthForm;
