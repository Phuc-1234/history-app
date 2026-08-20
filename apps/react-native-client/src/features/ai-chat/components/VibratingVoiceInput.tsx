import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from "react-native-reanimated";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";

interface VibratingVoiceInputProps {
    isTranscribing: boolean;
    transcript?: string;
}

const WaveBar: React.FC<{ delay: number; maxScale: number }> = ({ delay, maxScale }) => {
    const scaleY = useSharedValue(0.3);

    useEffect(() => {
        scaleY.value = withRepeat(
            withSequence(
                withTiming(maxScale, { duration: 300 + delay, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 300 + delay, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, [delay, maxScale, scaleY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scaleY: scaleY.value }],
    }));

    return <Animated.View style={[styles.waveBar, animatedStyle]} />;
};

export const VibratingVoiceInput: React.FC<VibratingVoiceInputProps> = ({
    isTranscribing,
    transcript,
}) => {
    if (isTranscribing) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.transcribingText}>
                    Đang chép lời...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.waveContainer}>
                <WaveBar delay={0} maxScale={1.2} />
                <WaveBar delay={100} maxScale={1.8} />
                <WaveBar delay={200} maxScale={1.4} />
                <WaveBar delay={150} maxScale={2.0} />
                <WaveBar delay={50} maxScale={1.5} />
            </View>
            <Text style={styles.listeningText} numberOfLines={1}>
                {transcript || "Đang lắng nghe..."}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        maxHeight: 100,
        minHeight: 40,
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    waveContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 20,
        marginRight: 10,
    },
    waveBar: {
        width: 3,
        height: 16,
        backgroundColor: colors.primary,
        borderRadius: 2,
        marginHorizontal: 2,
    },
    listeningText: {
        fontFamily: typography.fonts.medium,
        flex: 1,
        fontSize: 14,
        color: colors.primary,
    },
    transcribingText: {
        fontFamily: typography.fonts.italic,
        flex: 1,
        fontSize: 14,
        color: colors.textSecondary,
    },
});
