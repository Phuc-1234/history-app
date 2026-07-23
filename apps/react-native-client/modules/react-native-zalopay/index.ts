import { NativeModules, Platform } from "react-native";

const { ZaloPayModule } = NativeModules;

export default {
    init(appId: number, isSandbox: boolean = true) {
        if (Platform.OS !== "android" && Platform.OS !== "ios") return;
        if (!ZaloPayModule) {
            console.warn("[ZaloPay] Native module ZaloPayModule is not linked.");
            return;
        }
        return ZaloPayModule.init(appId, isSandbox);
    },

    payOrder(zpTransToken: string): Promise<{ status: "success" | "cancelled" | "error"; errorCode?: number; message?: string }> {
        if (Platform.OS !== "android" && Platform.OS !== "ios") {
            return Promise.reject(new Error("Unsupported platform"));
        }
        if (!ZaloPayModule) {
            return Promise.reject(new Error("Native module ZaloPayModule is not linked."));
        }
        return ZaloPayModule.payOrder(zpTransToken);
    },
};
