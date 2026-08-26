import { Platform } from "react-native";

export function redirectSystemPath(options: { path: string; initial: boolean }) {
  const path = options.path;

  // Log deep link paths for debugging
  console.log(`[NativeIntent] Received deep link path: "${path}"`);

  // Detect payment provider callback parameters (e.g. apptransid, status, transId, etc.)
  if (
    path.includes("apptransid=") ||
    path.includes("appTransId=") ||
    path.includes("zpTransToken=") ||
    path.includes("transToken=") ||
    path.includes("transactionId=")
  ) {
    const queryIndex = path.indexOf("?");
    const queryString = queryIndex !== -1 ? path.substring(queryIndex) : "";

    console.log(`[NativeIntent] Intercepted payment deep link, redirecting to /8_2_buy_gold with query: "${queryString}"`);
    return `/8_2_buy_gold${queryString}`;
  }

  // Handle PVP path format: pvp/1234 -> /pvp?roomCode=1234
  const pvpPathMatch = path.match(/^\/?pvp\/(\d{4})/);
  if (pvpPathMatch) {
    return `/pvp?roomCode=${pvpPathMatch[1]}`;
  }

  return path;
}
