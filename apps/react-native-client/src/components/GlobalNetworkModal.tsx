import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/storeHook";
import { setNetworkErrorVisible } from "@/store/networkSlice";
import { CustomModal } from "./Modal";

export function GlobalNetworkModal() {
    const dispatch = useAppDispatch();
    const isVisible = useAppSelector((state) => state.network.isNetworkErrorVisible);

    const handleClose = () => {
        dispatch(setNetworkErrorVisible(false));
    };

    return (
        <CustomModal
            visible={isVisible}
            title="Không có kết nối mạng"
            message="Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối internet của bạn."
            confirmText="Đã hiểu"
            showMascot={true}
            mascotExpression="sad"
            onConfirm={handleClose}
            onCancel={handleClose}
        />
    );
}
