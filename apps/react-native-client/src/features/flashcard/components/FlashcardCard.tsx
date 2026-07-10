import React, { useEffect, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    Animated,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Flashcard } from "../types";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

interface FlashcardCardProps {
    card: Flashcard;
    isFlipped: boolean;
    onFlip: () => void;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.75;
const CARD_HEIGHT = CARD_WIDTH * 1.25;

export function FlashcardCard({ card, isFlipped, onFlip }: FlashcardCardProps) {
    const flipAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(flipAnimation, {
            toValue: isFlipped ? 1 : 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, [isFlipped]);

    const frontInterpolate = flipAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"],
    });

    const backInterpolate = flipAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ["180deg", "360deg"],
    });

    const frontOpacityInterpolate = flipAnimation.interpolate({
        inputRange: [0, 0.5, 0.5001, 1],
        outputRange: [1, 1, 0, 0],
    });

    const backOpacityInterpolate = flipAnimation.interpolate({
        inputRange: [0, 0.5, 0.5001, 1],
        outputRange: [0, 0, 1, 1],
    });

    const frontAnimatedStyle = {
        transform: [{ rotateY: frontInterpolate }],
        opacity: frontOpacityInterpolate,
    };

    const backAnimatedStyle = {
        transform: [{ rotateY: backInterpolate }],
        opacity: backOpacityInterpolate,
    };

    return (
        <TouchableOpacity
            style={styles.cardContainer}
            activeOpacity={0.9}
            onPress={onFlip}
        >
            <View style={styles.cardWrapper}>
                {/* --- Front Card --- */}
                <Animated.View
                    style={[
                        styles.card,
                        styles.cardFront,
                        frontAnimatedStyle,
                    ]}
                    pointerEvents={isFlipped ? "none" : "auto"}
                >
                    <View style={styles.innerContent}>
                        <Text style={styles.cardText}>{card.front}</Text>
                    </View>
                    <View style={styles.iconCorner}>
                        <Ionicons
                            name="sync-outline"
                            size={20}
                            color={colors.textPlaceholder}
                        />
                    </View>
                </Animated.View>

                {/* --- Back Card --- */}
                <Animated.View
                    style={[
                        styles.card,
                        styles.cardBack,
                        backAnimatedStyle,
                    ]}
                    pointerEvents={isFlipped ? "auto" : "none"}
                >
                    <View style={styles.innerContent}>
                        <Text style={[styles.cardText, styles.cardTextBack]}>
                            {card.back}
                        </Text>
                    </View>
                    <View style={styles.iconCorner}>
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color={colors.success}
                        />
                    </View>
                </Animated.View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        alignSelf: "center",
        marginVertical: 20,
    },
    cardWrapper: {
        flex: 1,
    },
    card: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 24,
        backfaceVisibility: "hidden",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    cardFront: {
        zIndex: 2,
    },
    cardBack: {
        zIndex: 1,
        backgroundColor: colors.surfaceVariant,
        borderColor: colors.borderLight,
    },
    innerContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    cardText: {
        ...typography.h3,
        textAlign: "center",
        color: colors.textPrimary,
        lineHeight: 26,
    },
    cardTextBack: {
        ...typography.bodyLarge,
        color: colors.textSecondary,
    },
    iconCorner: {
        alignSelf: "flex-end",
        opacity: 0.8,
    },
});
