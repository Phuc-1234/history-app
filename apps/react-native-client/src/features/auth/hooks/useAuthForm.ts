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
            Alert.alert("Missing Fields", "Please key in both email and password.");
            return;
        }

        try {
            // Execute request through RTK Query mutation wrapper
            const response = await login({ email, password }).unwrap();
            
            // Commit user details to state engine
            dispatch(setProfile(response.profile));
            
            // Seamless routing swap to internal systems
            router.replace("/(tabs)/2_1_lessons");
        } catch (error: any) {
            console.error("Login attempt failure:", error);

            if (error?.data?.requiresVerification) {
                router.push({
                pathname: "/(1_auth)/1_6_otp_confirm",
                params: { 
                    email: email.trim().toLowerCase(),
                    autoSend: "true" 
                },
            });
                return;
            }

            const errorMessage = error?.data?.error || "Invalid server credentials.";
            Alert.alert("Authentication Failed", errorMessage);
        }
    }, [email, password, login, dispatch, router]);

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        navigateToRegister,
        navigateToLogin,
        submitAndEnterApp,
    };
}

export default useAuthForm;