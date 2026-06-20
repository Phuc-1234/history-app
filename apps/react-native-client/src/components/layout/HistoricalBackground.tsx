import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Easing, Dimensions } from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";
import { colors } from "../../theme/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");


// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────
interface MotifProps {
    size?: number;
    color?: string;
    opacity?: number;
}

export function TrongDongMotif({ size = 260, color = "#B91C1C", opacity = 0.05 }: MotifProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 200 200">
            {/* Outer Ring */}
            <Circle cx="100" cy="100" r="95" stroke={color} strokeWidth="1.5" fill="none" opacity={opacity * 1.5} />
            {/* Pattern Ring 1 */}
            <Circle cx="100" cy="100" r="85" stroke={color} strokeWidth="1" strokeDasharray="3, 3" fill="none" opacity={opacity} />
            {/* Pattern Ring 2 */}
            <Circle cx="100" cy="100" r="70" stroke={color} strokeWidth="2" fill="none" opacity={opacity * 0.8} />
            {/* Birds ring */}
            <Circle cx="100" cy="100" r="55" stroke={color} strokeWidth="1.5" strokeDasharray="6, 4" fill="none" opacity={opacity * 1.2} />
            {/* Inner Circle */}
            <Circle cx="100" cy="100" r="35" stroke={color} strokeWidth="1.5" fill="none" opacity={opacity * 1.5} />
            {/* Central Star (12 points) */}
            <Path
                d="M100,75 L103,90 L115,85 L108,96 L122,100 L108,104 L115,115 L103,110 L100,125 L97,110 L85,115 L92,104 L78,100 L92,96 L85,85 L97,90 Z"
                fill={color}
                opacity={opacity * 2}
            />
        </Svg>
    );
}



// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function HistoricalBackground() {
    // Animation drivers
    const rotateAnim = useRef(new Animated.Value(0)).current;
    

    useEffect(() => {
        // 1. Slow, infinite rotation for the Dong Son Drum
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 40000, //  seconds per full turn
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        
    }, [rotateAnim]);

    // Interpolate rotation
    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* 1. Rotating Dong Son Drum in Top-Left (faint Crimson) */}
            <Animated.View
                style={[
                    styles.trongDongTopLeft,
                    {
                        transform: [{ rotate: rotation }],
                    },
                ]}
            >
                <TrongDongMotif size={260} color="#B91C1C" opacity={0.1} />
            </Animated.View>

            {/* 2. Rotating Dong Son Drum in Bottom-Right (faint Gold) */}
            <Animated.View
                style={[
                    styles.trongDongBottomRight,
                    {
                        transform: [{ rotate: rotation }],
                    },
                ]}
            >
                <TrongDongMotif size={380} color={colors.secondary} opacity={0.08} />
            </Animated.View>

            
            
        </View>
    );
}

const styles = StyleSheet.create({
    trongDongTopLeft: {
        position: "absolute",
        top: -50,
        left: -70,
    },
    trongDongBottomRight: {
        position: "absolute",
        bottom: -80,
        right: -100,
    },
});
