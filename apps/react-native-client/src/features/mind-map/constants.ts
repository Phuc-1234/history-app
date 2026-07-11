import { Platform } from "react-native";
import { colors } from "../../theme/colors";

export const BRANCH_COLORS = colors.matchColors.map((item) => ({
    color: item.bg,
    borderColor: item.border,
    accentColor: item.text,
    lightBg: item.bg,
}));

export const SAFE_PADDING = Platform.OS === "web" ? 52 : 36;
export const MOBILE_BREAKPOINT = 600;

export const NODE_CONFIGS = {
    0: {
        minWidth: 130,
        maxWidth: 240,
        height: 56,
        fontSize: 14,
        fontWeight: "700" as const,
        rx: 16,
        paddingH: 20,
        paddingV: 14,
    },
    1: {
        minWidth: 80,
        maxWidth: 190,
        height: 44,
        fontSize: 12.5,
        fontWeight: "600" as const,
        rx: 12,
        paddingH: 16,
        paddingV: 12,
    },
    2: {
        minWidth: 56,
        maxWidth: 160,
        height: 36,
        fontSize: 11.5,
        fontWeight: "500" as const,
        rx: 10,
        paddingH: 14,
        paddingV: 10,
    },
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
