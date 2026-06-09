import { Platform } from "react-native";

// FIXME: Replace this with your computer's actual local Wi-Fi IP address
// (Open cmd, type 'ipconfig', and look for 'IPv4 Address')
const LOCAL_COMPUTER_IP = "172.20.10.2";

const LOCAL_URL = Platform.select({
    web: "http://localhost:5000",
    android: `http://${LOCAL_COMPUTER_IP}:5000`,
    ios: `http://${LOCAL_COMPUTER_IP}:5000`,
    default: `http://${LOCAL_COMPUTER_IP}:5000`,
});

const ENV_API_URL =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_URL_FEATURE ||
    process.env.EXPO_PUBLIC_API_URL_PRODUCTION;

// Set to true to use local server, false to use Render cloud server
const USE_LOCAL_SERVER = false;

export const API_BASE_URL = USE_LOCAL_SERVER ? LOCAL_URL : (ENV_API_URL || LOCAL_URL);

// Big bold terminal alert warning about fallback unencrypted web tokens
if (Platform.OS === "web") {
    console.log("\n" + "=".repeat(60));
    console.warn("🚨 SECURITY ALERT: WEB DEV DETECTED 🚨");
    console.warn(
        "Tokens are currently being redirected to ASYNC STORAGE (localStorage).",
    );
    console.warn("This data is NOT ENCRYPTED on the web browser framework.");
    console.warn(
        "Ensure secure HTTPOnly cookies or proper auth systems are used in production.",
    );
    console.log("=".repeat(60) + "\n");
}
