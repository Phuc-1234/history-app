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
                            color="#C7C7CC"
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
                            color="#34C759"
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
        backgroundColor: "#FFF",
        borderRadius: 24,
        padding: 24,
        backfaceVisibility: "hidden",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
        borderWidth: 1,
        borderColor: "#E5E5EA",
    },
    cardFront: {
        zIndex: 2,
    },
    cardBack: {
        zIndex: 1,
        backgroundColor: "#F9F9FF",
        borderColor: "#EAEAFE",
    },
    innerContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    cardText: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        color: "#1C1C1E",
        lineHeight: 26,
    },
    cardTextBack: {
        fontWeight: "500",
        color: "#3A3A3C",
    },
    iconCorner: {
        alignSelf: "flex-end",
        opacity: 0.8,
    },
});
