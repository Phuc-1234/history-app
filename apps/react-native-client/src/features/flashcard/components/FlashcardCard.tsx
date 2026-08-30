import React, { useEffect, useRef, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    Animated,
    TouchableOpacity,
    Dimensions,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Flashcard } from "../types";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { AppHtmlRenderer } from "../../../components/AppHtmlRenderer";

interface FlashcardCardProps {
    card: Flashcard;
    isFlipped: boolean;
    onFlip: () => void;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.86;
const CARD_HEIGHT = CARD_WIDTH * 1.28;

export function FlashcardCard({ card, isFlipped, onFlip }: FlashcardCardProps) {
    const flipAnimation = useRef(new Animated.Value(0)).current;
    const [frontContentHeight, setFrontContentHeight] = useState(0);
    const [backContentHeight, setBackContentHeight] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    const isFrontScrollable = containerHeight > 0 && frontContentHeight > containerHeight + 8;
    const isBackScrollable = containerHeight > 0 && backContentHeight > containerHeight + 8;
    const hasAnyScroll = isFrontScrollable || isBackScrollable;

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
        <View style={styles.cardContainer}>
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
                    <TouchableOpacity
                        style={styles.topTapArea}
                        activeOpacity={0.8}
                        onPress={onFlip}
                    >
                        <Text style={styles.cardFaceBadge}>MẶT TRƯỚC</Text>
                    </TouchableOpacity>

                    <View
                        style={styles.contentArea}
                        onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
                    >
                        {hasAnyScroll ? (
                            <ScrollView
                                style={styles.scrollWrapper}
                                contentContainerStyle={styles.scrollContentContainer}
                                showsVerticalScrollIndicator={isFrontScrollable}
                                showsHorizontalScrollIndicator={false}
                                nestedScrollEnabled={true}
                                directionalLockEnabled={true}
                                alwaysBounceHorizontal={false}
                                onContentSizeChange={(_w, h) => setFrontContentHeight(h)}
                            >
                                <AppHtmlRenderer
                                    html={card.front}
                                    contentWidth={CARD_WIDTH - 48}
                                    baseStyle={{
                                        ...typography.h3,
                                        textAlign: "center",
                                        color: colors.textPrimary,
                                        lineHeight: 26,
                                    }}
                                />
                            </ScrollView>
                        ) : (
                            <TouchableOpacity
                                style={styles.nonScrollTouchable}
                                activeOpacity={0.9}
                                onPress={onFlip}
                            >
                                <ScrollView
                                    style={styles.scrollWrapper}
                                    contentContainerStyle={styles.scrollContentContainer}
                                    scrollEnabled={false}
                                    showsVerticalScrollIndicator={false}
                                    onContentSizeChange={(_w, h) => setFrontContentHeight(h)}
                                    pointerEvents="none"
                                >
                                    <AppHtmlRenderer
                                        html={card.front}
                                        contentWidth={CARD_WIDTH - 48}
                                        baseStyle={{
                                            ...typography.h3,
                                            textAlign: "center",
                                            color: colors.textPrimary,
                                            lineHeight: 26,
                                        }}
                                    />
                                </ScrollView>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.bottomTapArea}
                        activeOpacity={0.8}
                        onPress={onFlip}
                    >
                        <View style={styles.iconCorner}>
                            <Ionicons
                                name="sync-outline"
                                size={20}
                                color={colors.textPlaceholder}
                            />
                        </View>
                    </TouchableOpacity>
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
                    <TouchableOpacity
                        style={styles.topTapArea}
                        activeOpacity={0.8}
                        onPress={onFlip}
                    >
                        <Text style={[styles.cardFaceBadge, styles.cardFaceBadgeBack]}>MẶT SAU</Text>
                    </TouchableOpacity>

                    <View style={styles.contentArea}>
                        {hasAnyScroll ? (
                            <ScrollView
                                style={styles.scrollWrapper}
                                contentContainerStyle={styles.scrollContentContainer}
                                showsVerticalScrollIndicator={isBackScrollable}
                                showsHorizontalScrollIndicator={false}
                                nestedScrollEnabled={true}
                                directionalLockEnabled={true}
                                alwaysBounceHorizontal={false}
                                onContentSizeChange={(_w, h) => setBackContentHeight(h)}
                            >
                                <AppHtmlRenderer
                                    html={card.back}
                                    contentWidth={CARD_WIDTH - 48}
                                    baseStyle={{
                                        ...typography.bodyLarge,
                                        textAlign: "center",
                                        color: colors.textSecondary,
                                        lineHeight: 24,
                                    }}
                                />
                            </ScrollView>
                        ) : (
                            <TouchableOpacity
                                style={styles.nonScrollTouchable}
                                activeOpacity={0.9}
                                onPress={onFlip}
                            >
                                <ScrollView
                                    style={styles.scrollWrapper}
                                    contentContainerStyle={styles.scrollContentContainer}
                                    scrollEnabled={false}
                                    showsVerticalScrollIndicator={false}
                                    onContentSizeChange={(_w, h) => setBackContentHeight(h)}
                                    pointerEvents="none"
                                >
                                    <AppHtmlRenderer
                                        html={card.back}
                                        contentWidth={CARD_WIDTH - 48}
                                        baseStyle={{
                                            ...typography.bodyLarge,
                                            textAlign: "center",
                                            color: colors.textSecondary,
                                            lineHeight: 24,
                                        }}
                                    />
                                </ScrollView>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.bottomTapArea}
                        activeOpacity={0.8}
                        onPress={onFlip}
                    >
                        <View style={styles.iconCorner}>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color={colors.success}
                            />
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        alignSelf: "center",
        marginVertical: 8,
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
        backfaceVisibility: "hidden",
        justifyContent: "space-between",
        overflow: "hidden",
    },
    cardFront: {
        zIndex: 2,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    cardBack: {
        zIndex: 1,
        backgroundColor: colors.surfaceVariant,
        borderWidth: 3,
        borderColor: colors.orange,
    },
    topTapArea: {
        width: "100%",
        paddingTop: 14,
        paddingBottom: 8,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    bottomTapArea: {
        width: "100%",
        paddingBottom: 14,
        paddingTop: 8,
        paddingHorizontal: 16,
        alignItems: "flex-end",
        justifyContent: "center",
    },
    iconCorner: {
        opacity: 0.8,
    },
    cardFaceBadge: {
        fontSize: 11,
        fontFamily: typography.fonts.semiBold,
        color: colors.textPlaceholder,
        letterSpacing: 0.8,
        textAlign: "center",
    },
    cardFaceBadgeBack: {
        color: colors.orange,
    },
    contentArea: {
        flex: 1,
        width: "100%",
        paddingHorizontal: 16,
    },
    scrollWrapper: {
        flex: 1,
        width: "100%",
    },
    scrollContentContainer: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 4,
    },
    nonScrollTouchable: {
        flex: 1,
        width: "100%",
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
});
