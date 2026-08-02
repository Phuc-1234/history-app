import { Platform } from "react-native";

// FIXME: Replace this with your computer's actual local Wi-Fi IP address
// (Open cmd, type 'ipconfig', and look for 'IPv4 Address')
const LOCAL_COMPUTER_IP = "192.168.90.101";

const LOCAL_URL = Platform.select({
    web: "http://localhost:5000",
    android: `http://${LOCAL_COMPUTER_IP}:5000`,
    ios: `http://${LOCAL_COMPUTER_IP}:5000`, // iOS Simulator / Physical local testing
    default: `http://${LOCAL_COMPUTER_IP}:5000`,
});

const getApiUrl = () => {
    const appEnv = process.env.EXPO_PUBLIC_APP_ENV;
    if (appEnv === "feature") {
        return process.env.EXPO_PUBLIC_API_URL_FEATURE || LOCAL_URL;
    }
    if (appEnv === "dev" || appEnv === "production") {
        return process.env.EXPO_PUBLIC_API_URL_PRODUCTION || LOCAL_URL;
    }
    if (appEnv === "local") {
        return LOCAL_URL;
    }
    const ENV_API_URL =
        process.env.EXPO_PUBLIC_API_URL ||
        process.env.EXPO_PUBLIC_API_URL_PRODUCTION ||
        process.env.EXPO_PUBLIC_API_URL_FEATURE;
    return ENV_API_URL || LOCAL_URL;
};


export const API_BASE_URL = getApiUrl();

// Big bold terminal alert warning about fallback unencrypted web tokens
if (Platform.OS === "web") {
    console.log("\n" + "=".repeat(60));
    console.warn("[SECURITY ALERT] WEB DEV DETECTED");
    console.warn(
        "Tokens are currently being redirected to ASYNC STORAGE (localStorage).",
    );
    console.warn("This data is NOT ENCRYPTED on the web browser framework.");
    console.warn(
        "Ensure secure HTTPOnly cookies or proper auth systems are used in production.",
    );
    console.log("=".repeat(60) + "\n");
}
