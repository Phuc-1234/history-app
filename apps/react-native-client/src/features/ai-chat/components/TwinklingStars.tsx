import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/theme/colors";

interface TwinklingStarProps {
    size: number;
    color?: string;
    style?: any;
    delay?: number;
    duration?: number;
    maxOpacity?: number;
}

const TwinklingStar: React.FC<TwinklingStarProps> = ({
    size,
    color = colors.gold, // Warm yellow star color
    style,
    delay = 0,
    duration = 1500,
    maxOpacity = 1.0,
}) => {
    const scale = useRef(new Animated.Value(0.2)).current;
    const opacity = useRef(new Animated.Value(0.1)).current;

    useEffect(() => {
        const startAnim = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(scale, {
                            toValue: 1.1,
                            duration: duration * 0.4,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: maxOpacity,
                            duration: duration * 0.4,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.parallel([
                        Animated.timing(scale, {
                            toValue: 0.2,
                            duration: duration * 0.6,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: maxOpacity * 0.2,
                            duration: duration * 0.6,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            ).start();
        };

        let timer: NodeJS.Timeout;
        if (delay > 0) {
            timer = setTimeout(startAnim, delay);
        } else {
            startAnim();
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [scale, opacity, delay, duration, maxOpacity]);

    return (
        <Animated.View
            style={[
                style,
                styles.starWrapper,
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

interface TwinklingStarsProps {
    mode: "fab" | "avatar" | "badge" | "header";
}

export const TwinklingStars: React.FC<TwinklingStarsProps> = ({ mode }) => {
    if (mode === "header") {
        return (
            <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} pointerEvents="none">
                <TwinklingStar size={24} style={{ top: 2, left: 10 }} delay={0} duration={2400} maxOpacity={1.0} />
                <TwinklingStar size={18} style={{ top: 22, left: 60 }} delay={800} duration={3000} maxOpacity={0.85} />
                <TwinklingStar size={22} style={{ bottom: 2, left: "22%" }} delay={1400} duration={2600} maxOpacity={0.9} />
                <TwinklingStar size={20} style={{ top: 4, left: "42%" }} delay={300} duration={2800} maxOpacity={0.85} />
                <TwinklingStar size={26} style={{ top: 2, right: "32%" }} delay={600} duration={3200} maxOpacity={1.0} />
                <TwinklingStar size={18} style={{ bottom: 2, right: "20%" }} delay={1600} duration={2500} maxOpacity={0.85} />
                <TwinklingStar size={22} style={{ top: 20, right: 70 }} delay={1200} duration={2900} maxOpacity={0.9} />
                <TwinklingStar size={24} style={{ bottom: 2, right: 12 }} delay={900} duration={3400} maxOpacity={0.95} />
            </View>
        );
    }

    if (mode === "badge") {
        return (
            <View style={[StyleSheet.absoluteFill, { overflow: "visible" }]} pointerEvents="none">
                <TwinklingStar size={12} style={{ top: -8, right: -6 }} delay={0} duration={2500} maxOpacity={1.0} />
                <TwinklingStar size={9} style={{ top: -6, left: -4 }} delay={800} duration={2800} maxOpacity={0.85} />
                <TwinklingStar size={8} style={{ bottom: -5, right: 4 }} delay={1500} duration={3000} maxOpacity={0.8} />
            </View>
        );
    }

    if (mode === "fab") {
        return (
            <View style={[StyleSheet.absoluteFill, { overflow: "visible" }]} pointerEvents="none">
                {/* Outside / Exceeding boundary stars */}
                <TwinklingStar size={24} style={{ top: -16, left: -12 }} delay={0} duration={3500} maxOpacity={1.0} />
                <TwinklingStar size={20} style={{ bottom: -14, right: -8 }} delay={1000} duration={4000} maxOpacity={0.9} />
                <TwinklingStar size={14} style={{ top: 12, right: -14 }} delay={2000} duration={3000} maxOpacity={0.7} />
                <TwinklingStar size={11} style={{ bottom: 8, left: -14 }} delay={500} duration={3800} maxOpacity={0.6} />
                
                {/* Overlapping FAB body stars */}
                <TwinklingStar size={16} style={{ top: 8, right: 6 }} delay={1500} duration={3200} maxOpacity={0.95} />
                <TwinklingStar size={12} style={{ bottom: 10, left: 8 }} delay={2500} duration={3600} maxOpacity={0.8} />
            </View>
        );
    }

    // Avatar mode
    return (
        <View style={[StyleSheet.absoluteFill, { overflow: "visible" }]} pointerEvents="none">
            {/* Outside / Exceeding boundary stars */}
            <TwinklingStar size={16} style={{ top: -12, right: -10 }} delay={0} duration={3000} maxOpacity={1.0} />
            <TwinklingStar size={11} style={{ bottom: -8, left: -8 }} delay={1200} duration={3600} maxOpacity={0.7} />
            <TwinklingStar size={9} style={{ top: 10, left: -11 }} delay={600} duration={3200} maxOpacity={0.6} />

            {/* Overlapping Avatar body stars */}
            <TwinklingStar size={10} style={{ top: 4, left: 4 }} delay={1800} duration={3400} maxOpacity={0.9} />
            <TwinklingStar size={8} style={{ bottom: 6, right: 6 }} delay={800} duration={3000} maxOpacity={0.85} />
        </View>
    );
};

const styles = StyleSheet.create({
    starWrapper: {
        position: "absolute",
    },
});
