import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    ImageSourcePropType,
    StyleSheet,
    View,
} from "react-native";
import { colors } from "../../theme/colors";

// ─── Assets ─────────────────────────────────────────────────────────────────
// Source: user-supplied historical cloud/sun motifs (transparent PNGs).
//   • cloud_pair  — a paired cluster of stylised clouds (image 1)
//   • cloud_sun   — sun rising over clouds (image 2)
//   • cloud_piece_* — 15 individual clouds auto-split from a sheet (image 3)
// Together they compose a "historical sky": sun + scattered clouds drifting.
const CLOUD_PAIR = require("../../../assets/images/cloud_pair.png");
const CLOUD_SUN = require("../../../assets/images/cloud_sun.png");
const CLOUD_PIECES: ImageSourcePropType[] = [
    require("../../../assets/images/cloud_piece_00.png"),
    require("../../../assets/images/cloud_piece_01.png"),
    require("../../../assets/images/cloud_piece_02.png"),
    require("../../../assets/images/cloud_piece_03.png"),
    require("../../../assets/images/cloud_piece_04.png"),
    require("../../../assets/images/cloud_piece_05.png"),
    require("../../../assets/images/cloud_piece_06.png"),
    require("../../../assets/images/cloud_piece_07.png"),
    require("../../../assets/images/cloud_piece_08.png"),
    require("../../../assets/images/cloud_piece_09.png"),
    require("../../../assets/images/cloud_piece_10.png"),
    require("../../../assets/images/cloud_piece_11.png"),
    require("../../../assets/images/cloud_piece_12.png"),
    require("../../../assets/images/cloud_piece_13.png"),
    require("../../../assets/images/cloud_piece_14.png"),
];

// ─── Config ─────────────────────────────────────────────────────────────────
const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;

// How many small drifting clouds (sampled from CLOUD_PIECES) to render.
const DRIFTING_CLOUD_COUNT = 10;

// Tint: brand gold looks like classical gilded sky motifs on old scrolls.
const TINT: keyof typeof colors = "secondary"; // imperial gold
const OPACITY = 0.22;

// ─── Per-cloud config (computed once per mount) ─────────────────────────────
interface DriftConfig {
    src: ImageSourcePropType;
    startX: number; // horizontal start (px) — may be off-screen
    startY: number; // vertical position (px)
    size: number; // rendered size (px) — square-ish
    driftDurationMs: number; // time to cross the screen
    driftRange: number; // total horizontal travel distance (px)
    bobAmplitude: number; // gentle vertical bob amplitude (px)
    bobDurationMs: number; // vertical bob period
}

function makeDriftConfig(src: ImageSourcePropType): DriftConfig {
    const size = 80 + Math.random() * 110; // 80 .. 190
    return {
        src,
        // Start scattered: some on-screen, some off-screen left so the drift
        // fills in naturally as clouds enter from the left.
        startX: -size + Math.random() * (SCREEN_W + size),
        startY: Math.random() * SCREEN_H * 0.85,
        size,
        driftDurationMs: 38000 + Math.random() * 22000, // 38s .. 60s
        driftRange: SCREEN_W + size * 2,
        bobAmplitude: 5 + Math.random() * 9, // 5 .. 14
        bobDurationMs: 9000 + Math.random() * 5000,
    };
}

// ─── A single drifting cloud ────────────────────────────────────────────────
function DriftingCloud({ config }: { config: DriftConfig }) {
    const drift = useRef(new Animated.Value(0)).current;
    const bob = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const driftLoop = Animated.loop(
            Animated.timing(drift, {
                toValue: config.driftRange,
                duration: config.driftDurationMs,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        const bobLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(bob, {
                    toValue: -config.bobAmplitude,
                    duration: config.bobDurationMs / 2,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(bob, {
                    toValue: 0,
                    duration: config.bobDurationMs / 2,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );
        driftLoop.start();
        bobLoop.start();
        return () => {
            driftLoop.stop();
            bobLoop.stop();
        };
    }, [config, drift, bob]);

    return (
        <Animated.View
            style={[
                styles.element,
                {
                    left: config.startX,
                    top: config.startY,
                    transform: [{ translateX: drift }, { translateY: bob }],
                },
            ]}
            pointerEvents="none"
        >
            <Image
                source={config.src}
                style={{
                    width: config.size,
                    height: config.size,
                    tintColor: colors[TINT],
                    opacity: OPACITY,
                }}
                resizeMode="contain"
            />
        </Animated.View>
    );
}

// ─── Static feature pieces (sun-with-clouds + cloud pair) ───────────────────
// These are larger, mostly-stationary focal elements placed in the corners so
// the composition reads as a painted sky rather than just floating chips.
function StaticFeature({
    src,
    size,
    anchor,
    bobAmplitude = 6,
    bobDurationMs = 11000,
}: {
    src: ImageSourcePropType;
    size: number;
    anchor: { left?: number; right?: number; top?: number; bottom?: number };
    bobAmplitude?: number;
    bobDurationMs?: number;
}) {
    const bob = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const bobLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(bob, {
                    toValue: -bobAmplitude,
                    duration: bobDurationMs / 2,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(bob, {
                    toValue: 0,
                    duration: bobDurationMs / 2,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );
        bobLoop.start();
        return () => bobLoop.stop();
    }, [bob, bobAmplitude, bobDurationMs]);

    return (
        <Animated.View
            style={[
                styles.element,
                anchor,
                { transform: [{ translateY: bob }] },
            ]}
            pointerEvents="none"
        >
            <Image
                source={src}
                style={{
                    width: size,
                    height: size,
                    tintColor: colors[TINT],
                    opacity: OPACITY + 0.04, // focal pieces a touch more visible
                }}
                resizeMode="contain"
            />
        </Animated.View>
    );
}

// ─── Public component ───────────────────────────────────────────────────────
// Drop-in sibling of the other background components:
// absolute-fill, pointerEvents none. Composes the sun-with-clouds, a cloud
// pair, and several drifting clouds into a single historical sky scene.
export default function HistoricalSkyBackground() {
    // Pick a stable random subset of cloud pieces for the drifting layer.
    const driftConfigs = useMemo(() => {
        const shuffled = [...CLOUD_PIECES].sort(() => Math.random() - 0.5);
        return shuffled
            .slice(0, DRIFTING_CLOUD_COUNT)
            .map(makeDriftConfig);
    }, []);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Focal: sun rising over clouds — top-right */}
            <StaticFeature
                src={CLOUD_SUN}
                size={300}
                anchor={{ right: -60, top: -40 }}
            />
            {/* Focal: cloud pair — bottom-left */}
            <StaticFeature
                src={CLOUD_PAIR}
                size={280}
                anchor={{ left: -70, bottom: -60 }}
                bobAmplitude={8}
                bobDurationMs={13000}
            />
            {/* Drifting cloud layer */}
            {driftConfigs.map((c, i) => (
                <DriftingCloud key={i} config={c} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    element: {
        position: "absolute",
    },
});
