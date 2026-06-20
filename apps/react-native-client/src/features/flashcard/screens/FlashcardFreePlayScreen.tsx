import React, { useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";

import { FlashcardCard } from "../components/FlashcardCard";
import { FreeFlashcardControls } from "../components/FreeFlashcardControls";
import { useGetFlashcardsByLessonQuery, useGetFlashcardsBySectionQuery, useGetFlashcardsByNodeQuery } from "../flashcardApiSlice";

interface FlashcardFreePlayScreenProps {
    lessonId?: number;
    sectionId?: number;
    nodeId?: number;
}

export default function FlashcardFreePlayScreen({ lessonId, sectionId, nodeId }: FlashcardFreePlayScreenProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Fetch flashcards from API
    const {
        data: lessonCards,
        isLoading: isLessonLoading,
        isError: isLessonError,
    } = useGetFlashcardsByLessonQuery(lessonId!, {
        skip: !lessonId,
    });

    const {
        data: sectionCards,
        isLoading: isSectionLoading,
        isError: isSectionError,
    } = useGetFlashcardsBySectionQuery(sectionId!, {
        skip: !sectionId,
    });

    const {
        data: nodeCards,
        isLoading: isNodeLoading,
        isError: isNodeError,
    } = useGetFlashcardsByNodeQuery(nodeId!, {
        skip: !nodeId,
    });

    const cards = lessonId ? lessonCards : (sectionId ? sectionCards : nodeCards);
    const isLoading = lessonId ? isLessonLoading : (sectionId ? isSectionLoading : isNodeLoading);
    const isError = lessonId ? isLessonError : (sectionId ? isSectionError : isNodeError);

    const totalCount = cards?.length ?? 0;
    const currentCard = cards?.[currentIndex] ?? null;

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handlePrev = () => {
        if (currentIndex <= 0) return;
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => prev - 1);
        }, 150);
    };

    const handleNext = () => {
        if (currentIndex >= totalCount - 1) return;
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
        }, 150);
    };

    // --- Loading state ---
    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#5856D6" />
                <Text style={styles.loadingText}>Đang tải thẻ lật...</Text>
            </View>
        );
    }

    // --- Error state ---
    if (isError) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
                <Text style={styles.errorText}>
                    Vui lòng kiểm tra kết nối mạng và thử lại.
                </Text>
            </View>
        );
    }

    // --- Empty state (API returns []) ---
    if (!cards || cards.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>Chưa có thẻ lật</Text>
                <Text style={styles.emptyText}>
                    Bài học này chưa có thẻ lật nào. Hãy thử bài học khác nhé!
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* --- Flashcard Display --- */}
            {currentCard ? (
                <View style={styles.cardArea}>
                    <FlashcardCard
                        card={currentCard}
                        isFlipped={isFlipped}
                        onFlip={handleFlip}
                    />

                    {/* Card counter indicator */}
                    <Text style={styles.cardCounterText}>
                        {currentIndex + 1} / {totalCount}
                    </Text>
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Đang tải dữ liệu...</Text>
                </View>
            )}

            {/* --- Bottom controls --- */}
            <View style={styles.footerContainer}>
                <FreeFlashcardControls
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onFlip={handleFlip}
                    isFlipped={isFlipped}
                    hasPrev={currentIndex > 0}
                    hasNext={currentIndex < totalCount - 1}
                />

                {/* --- Dot indicators --- */}
                <View style={styles.dotsContainer}>
                    {cards.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex
                                    ? styles.dotActive
                                    : styles.dotInactive,
                            ]}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 24,
    },
    cardArea: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    cardCounterText: {
        fontSize: 15,
        color: "#5856D6",
        fontWeight: "700",
        marginTop: 8,
        textAlign: "center",
    },
    footerContainer: {
        width: "100%",
        alignItems: "center",
        gap: 8,
    },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 20,
        marginBottom: 8,
        flexWrap: "wrap",
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        backgroundColor: "#5856D6",
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    dotInactive: {
        backgroundColor: "#D1D1D6",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
        backgroundColor: "#F8F9FA",
    },
    loadingText: {
        fontSize: 15,
        color: "#8E8E93",
        marginTop: 16,
        fontWeight: "500",
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1C1C1E",
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: "#8E8E93",
        textAlign: "center",
        lineHeight: 20,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1C1C1E",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#8E8E93",
        textAlign: "center",
        lineHeight: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
