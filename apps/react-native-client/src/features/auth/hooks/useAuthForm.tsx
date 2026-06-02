import { useRouter } from "expo-router";
import { useCallback } from "react";

export function useAuthForm() {
    const router = useRouter();

    const navigateToRegister = useCallback(() => {
        router.push("/(1_auth)/1_2_register");
    }, [router]);

    const navigateToLogin = useCallback(() => {
        router.push("/(1_auth)/1_1_login");
    }, [router]);

    const submitAndEnterApp = useCallback(() => {
        // For now accept any input and navigate to lessons home
        router.replace("/(tabs)/2_1_lessons");
    }, [router]);

    return {
        navigateToRegister,
        navigateToLogin,
        submitAndEnterApp,
    };
}

export default useAuthForm;
