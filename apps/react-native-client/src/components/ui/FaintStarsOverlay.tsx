import React, { useEffect, useRef } from "react";
import { Animated, DimensionValue, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface FaintStarsOverlayProps {
    color?: string;
    isProHeader?: boolean;
}

interface StarItemProps {
    top?: DimensionValue;
    bottom?: DimensionValue;
    left?: DimensionValue;
    right?: DimensionValue;
    size: number;
    delay?: number;
    duration?: number;
    baseOpacity?: number;
    color: string;
}

const TwinklingStarItem: React.FC<StarItemProps> = ({
    top,
    bottom,
    left,
    right,
    size,
    delay = 0,
    duration = 2400,
    baseOpacity = 0.45,
    color,
}) => {
    const scale = useRef(new Animated.Value(0.4)).current;
    const opacity = useRef(new Animated.Value(baseOpacity * 0.25)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(scale, {
                        toValue: 1.2,
                        duration: duration * 0.45,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: baseOpacity,
                        duration: duration * 0.45,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(scale, {
                        toValue: 0.4,
                        duration: duration * 0.55,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: baseOpacity * 0.2,
                        duration: duration * 0.55,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        const timer = setTimeout(() => {
            anim.start();
        }, delay);

        return () => {
            clearTimeout(timer);
            anim.stop();
        };
    }, [scale, opacity, delay, duration, baseOpacity]);

    return (
        <Animated.View
            style={[
                styles.starPosition,
                { top, bottom, left, right },
                {
                    transform: [{ scale }],
                    opacity,
                },
            ]}
        >
            <Svg width={size} height={size} viewBox="0 0 24 24">
                <Path
                    d="M12 2 Q12 12 2 12 Q12 12 12 22 Q12 12 22 12 Q12 12 12 2"
                    fill={color}
                />
            </Svg>
        </Animated.View>
    );
};

const STARS_CONFIG: Omit<StarItemProps, "color">[] = [
    { top: "12%", left: "8%", size: 18, delay: 0, duration: 2200, baseOpacity: 0.5 },
    { top: "22%", left: "32%", size: 12, delay: 600, duration: 2800, baseOpacity: 0.35 },
    { top: "15%", right: "12%", size: 22, delay: 300, duration: 2500, baseOpacity: 0.55 },
    { top: "45%", right: "28%", size: 14, delay: 900, duration: 2100, baseOpacity: 0.4 },
    { top: "58%", left: "14%", size: 16, delay: 400, duration: 2600, baseOpacity: 0.45 },
    { bottom: "18%", left: "24%", size: 13, delay: 1200, duration: 2900, baseOpacity: 0.35 },
    { bottom: "12%", right: "18%", size: 20, delay: 700, duration: 2300, baseOpacity: 0.5 },
    { top: "8%", left: "54%", size: 11, delay: 200, duration: 2700, baseOpacity: 0.3 },
    { bottom: "35%", right: "8%", size: 15, delay: 1000, duration: 2400, baseOpacity: 0.4 },
    { top: "68%", right: "42%", size: 10, delay: 1500, duration: 3000, baseOpacity: 0.3 },
];

const PRO_STARS_CONFIG: Omit<StarItemProps, "color">[] = [
    { top: "12%", left: "8%", size: 28, delay: 0, duration: 2200, baseOpacity: 0.7 },
    { top: "22%", left: "32%", size: 20, delay: 600, duration: 2800, baseOpacity: 0.55 },
    { top: "15%", right: "12%", size: 34, delay: 300, duration: 2500, baseOpacity: 0.75 },
    { top: "45%", right: "28%", size: 22, delay: 900, duration: 2100, baseOpacity: 0.6 },
    { top: "58%", left: "14%", size: 26, delay: 400, duration: 2600, baseOpacity: 0.65 },
    { bottom: "18%", left: "24%", size: 22, delay: 1200, duration: 2900, baseOpacity: 0.55 },
    { bottom: "12%", right: "18%", size: 30, delay: 700, duration: 2300, baseOpacity: 0.7 },
    { top: "8%", left: "54%", size: 18, delay: 200, duration: 2700, baseOpacity: 0.5 },
    { bottom: "35%", right: "8%", size: 24, delay: 1000, duration: 2400, baseOpacity: 0.6 },
    { top: "68%", right: "42%", size: 16, delay: 1500, duration: 3000, baseOpacity: 0.5 },
    { top: "5%", left: "20%", size: 24, delay: 500, duration: 2300, baseOpacity: 0.65 },
    { top: "30%", right: "50%", size: 20, delay: 800, duration: 2600, baseOpacity: 0.6 },
    { bottom: "5%", left: "45%", size: 22, delay: 1100, duration: 2700, baseOpacity: 0.7 },
    { bottom: "25%", left: "8%", size: 18, delay: 1300, duration: 2500, baseOpacity: 0.5 },
    { top: "50%", left: "40%", size: 24, delay: 700, duration: 2200, baseOpacity: 0.65 },
    { bottom: "28%", right: "45%", size: 19, delay: 1400, duration: 2800, baseOpacity: 0.55 },
];

export const FaintStarsOverlay: React.FC<FaintStarsOverlayProps> = ({
    color = "#FFFFFF",
    isProHeader = false,
}) => {
    const config = isProHeader ? PRO_STARS_CONFIG : STARS_CONFIG;
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {config.map((star, index) => (
                <TwinklingStarItem key={index} {...star} color={color} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    starPosition: {
        position: "absolute",
    },
});
