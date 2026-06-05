import { Platform } from "react-native";


let PRODUCTION_URL
// 1. Get your production URL injected cleanly by Expo (no 'dotenv' needed!)
// PRODUCTION_URL = process.env.EXPO_PUBLIC_API_URL_PRODUCTION;
// PRODUCTION_URL = process.env.EXPO_PUBLIC_API_URL_FEATURE;
// FIXME: Replace this with your computer's actual local Wi-Fi IP address
// (Open cmd, type 'ipconfig', and look for 'IPv4 Address')
const LOCAL_COMPUTER_IP = "192.168.1.X";

const LOCAL_URL = Platform.select({
  web: "http://localhost:5000",
  android: "http://10.0.2.2:5000", // Android emulator loopback
  ios: `http://${LOCAL_COMPUTER_IP}:5000`, // iOS Simulator / Physical local testing
  default: `http://${LOCAL_COMPUTER_IP}:5000`,
});

export const API_BASE_URL = PRODUCTION_URL || LOCAL_URL;

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
