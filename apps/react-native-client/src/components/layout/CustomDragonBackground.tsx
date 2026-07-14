import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Image, StyleSheet, View } from "react-native";

// ─── Asset ──────────────────────────────────────────────────────────────────
// User-supplied dragon illustration: cream line-art on a transparent background.
// Rendered at its native size (no upscaling — keeps strokes crisp) and centred
// on screen as a faint, slowly-swaying watermark.
const CUSTOM_DRAGON_IMG = require("../../../assets/images/custom_dragon.png");

// ─── Config ─────────────────────────────────────────────────────────────────
const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;

// Native image size — do NOT upscale, otherwise the line-art looks pixelated.
const IMG_W = 500;
const IMG_H = 500;

const ROTATE_RANGE = 3; // ±3deg gentle sway so the dragon feels alive
const ROTATE_DURATION_MS = 24000; // ~24s per sway

// Line-art opacity: faint so it reads as a watermark, not a sticker.
const DRAGON_OPACITY = 0.18;

// ─── Swaying dragon ────────────────────────────────────────────────────────
function SwayingDragon() {
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const halfRot = ROTATE_DURATION_MS / 2;
        const rotateLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(rotate, {
                    toValue: ROTATE_RANGE,
                    duration: halfRot,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(rotate, {
                    toValue: -ROTATE_RANGE,
                    duration: halfRot,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );
        rotateLoop.start();
        return () => {
            rotateLoop.stop();
        };
    }, [rotate]);

    const rotateDeg = rotate.interpolate({
        inputRange: [-ROTATE_RANGE, ROTATE_RANGE],
        outputRange: [`-${ROTATE_RANGE}deg`, `${ROTATE_RANGE}deg`],
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Dragon at native size, centred on screen, swaying gently. Source
                has a transparent background and cream line-art, so no tintColor
                is applied — render as-is at low opacity for a soft watermark. */}
            <Animated.View
                style={[
                    styles.dragonWrap,
                    { transform: [{ rotate: rotateDeg }] },
                ]}
            >
                <Image
                    source={CUSTOM_DRAGON_IMG}
                    style={{ width: IMG_W, height: IMG_H, opacity: DRAGON_OPACITY }}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
}

// ─── Public component ───────────────────────────────────────────────────────
// Drop-in sibling of the other background components:
// absolute-fill, pointerEvents none.
export default function CustomDragonBackground() {
    return <SwayingDragon />;
}

const styles = StyleSheet.create({
    dragonWrap: {
        position: "absolute",
        // Centre the native-size image on the screen.
        left: (SCREEN_W - IMG_W) / 2,
        top: (SCREEN_H - IMG_H) / 2,
    },
});
