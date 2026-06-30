import { Platform } from "react-native";

export const BRANCH_COLORS = [
    { color: "#F5F3FF", borderColor: "#C4B5FD", accentColor: "#7C3AED", lightBg: "#FAF5FF" },
    { color: "#EFF6FF", borderColor: "#93C5FD", accentColor: "#2563EB", lightBg: "#F0F7FF" },
    { color: "#ECFDF5", borderColor: "#6EE7B7", accentColor: "#059669", lightBg: "#F0FDF4" },
    { color: "#FFFBEB", borderColor: "#FCD34D", accentColor: "#D97706", lightBg: "#FEFCE8" },
    { color: "#FFF1F2", borderColor: "#FDA4AF", accentColor: "#E11D48", lightBg: "#FFF1F2" },
];

export const SAFE_PADDING = Platform.OS === "web" ? 52 : 36;
export const MOBILE_BREAKPOINT = 600;

export const NODE_CONFIGS = {
    0: { minWidth: 200, height: 56, fontSize: 14, fontWeight: "700" as const, rx: 16, paddingH: 28, paddingV: 14 },
    1: { minWidth: 155, height: 44, fontSize: 12.5, fontWeight: "600" as const, rx: 12, paddingH: 22, paddingV: 12 },
    2: { minWidth: 120, height: 36, fontSize: 11.5, fontWeight: "500" as const, rx: 10, paddingH: 18, paddingV: 10 },
};

export const SPRING_CONFIG = { damping: 20, stiffness: 150 };

export const animationConfig = {
    nodeBaseDelay: 60,
    nodeDepthDelay: 85,
    nodeSiblingDelay: 18,
    nodeDuration: 420,
    nodeStartScale: 0.72,
    nodeStartOffset: 0.18,
    edgeBaseDelay: 120,
    edgeDepthDelay: 80,
    edgeDuration: 520,
    edgeDimOpacity: 0.14,
    edgeIdleOpacity: 0.42,
    edgeActiveOpacity: 0.92,
    nodeDimOpacity: 0.42,
    nodeIdleOpacity: 1,
    nodeActiveScale: 1.045,
    easing: "outCubic",
    spring: { damping: 18, stiffness: 170, mass: 0.85 },
};

export function getScaleLimits(isMobile: boolean) {
    return { min: isMobile ? 0.45 : 0.35, max: isMobile ? 2 : 2.5 };
}
