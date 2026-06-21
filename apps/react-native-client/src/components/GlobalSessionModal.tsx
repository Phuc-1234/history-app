import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/storeHook";
import { useRouter } from "expo-router";
import { appLogout } from "@/features/auth/store/authSlice";
import { CustomModal } from "./Modal";

export function GlobalSessionModal() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const isSessionExpired = useAppSelector((state) => state.auth.isSessionExpired);

    const handleLoginAgain = async () => {
        await dispatch(appLogout());
        router.replace("/(1_auth)/1_1_login");
    };

    const handleContinueAsGuest = async () => {
        await dispatch(appLogout());
        router.replace("/(tabs)/2_1_lessons");
    };

    return (
        <CustomModal
            visible={isSessionExpired}
            title="Hết phiên đăng nhập"
            message="Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại hoặc tiếp tục sử dụng ứng dụng với tư cách khách."
            confirmText="Đăng nhập lại"
            cancelText="Tiếp tục khách"
            onConfirm={handleLoginAgain}
            onCancel={handleContinueAsGuest}
        />
    );
}
