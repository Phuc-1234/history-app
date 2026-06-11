import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

import { FlashcardCard } from "../components/FlashcardCard";
import { FlashcardControls } from "../components/FlashcardControls";
import { FlashcardProgress } from "../components/FlashcardProgress";
import { useGetFlashcardsByLessonQuery } from "../flashcardApiSlice";
import { CardState } from "../types";

interface FlashcardPlayScreenProps {
    lessonId?: number;
}

export default function FlashcardPlayScreen({ lessonId }: FlashcardPlayScreenProps) {
    const router = useRouter();

    // Fetch flashcards from API
    const {
        data: flashcards,
        isLoading,
        isError,
        error,
    } = useGetFlashcardsByLessonQuery(lessonId!, {
        skip: !lessonId,
    });

    // Initialize 20 cards with 0 memorized count
    const [deck, setDeck] = useState<CardState[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Initialize deck when API data arrives
    useEffect(() => {
        if (flashcards && flashcards.length > 0) {
            const initialDeck = flashcards.map((card) => ({
                card,
                memorizedCount: 0,
            }));
            setDeck(initialDeck);
            setCurrentIndex(0);
            setIsFlipped(false);
        }
    }, [flashcards]);

    // Filter cards that are not completed (memorized < 2 times)
    const incompleteCards = deck.filter((item) => item.memorizedCount < 2);
    const completedCount = deck.filter((item) => item.memorizedCount >= 2).length;
    const totalCount = deck.length;

    const currentCardState = incompleteCards[currentIndex] || null;

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleNotMemorized = () => {
        if (!currentCardState) return;

        setIsFlipped(false);

        // Wait brief delay for flip animation to finish before changing card
        setTimeout(() => {
            if (incompleteCards.length > 1) {
                setCurrentIndex((prev) => (prev + 1) % incompleteCards.length);
            }
        }, 150);
    };

    const handleMemorized = () => {
        if (!currentCardState) return;

        const currentId = currentCardState.card.id;
        const newMemorizedCount = currentCardState.memorizedCount + 1;

        // Update deck state
        const updatedDeck = deck.map((item) => {
            if (item.card.id === currentId) {
                return { ...item, memorizedCount: newMemorizedCount };
            }
            return item;
        });

        const nextIncomplete = updatedDeck.filter((item) => item.memorizedCount < 2);

        // Check if finished
        if (nextIncomplete.length === 0) {
            setIsFlipped(false);
            setDeck(updatedDeck);
            setTimeout(() => {
                router.replace("/(3_4_lessons)/4_5_fcard_complete");
            }, 250);
            return;
        }

        setIsFlipped(false);

        // Update active index and deck state
        setTimeout(() => {
            setDeck(updatedDeck);
            
            const wasCompleted = newMemorizedCount >= 2;
            if (wasCompleted) {
                // Current card is removed from incomplete list.
                // Next card shifts to current index. Clamp it.
                setCurrentIndex(currentIndex % nextIncomplete.length);
            } else {
                // Card is not completed yet (only 1 check).
                // Rotate to show another card next.
                setCurrentIndex((currentIndex + 1) % nextIncomplete.length);
            }
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
    if (!flashcards || flashcards.length === 0) {
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
                {/* --- Flashcard Play Area --- */}
                {currentCardState ? (
                    <View style={styles.cardArea}>
                        <FlashcardCard
                            card={currentCardState.card}
                            isFlipped={isFlipped}
                            onFlip={handleFlip}
                        />

                        {/* Shows micro-indicator of memorized count for active card */}
                        <Text style={styles.cardHintText}>
                            {currentCardState.memorizedCount === 1
                                                ? "Đã thuộc 1 lần (Cần thuộc thêm 1 lần)"
                                                : "Chưa thuộc lần nào"}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Đang tải dữ liệu...</Text>
                    </View>
                )}

                {/* --- Bottom controls and progress --- */}
                <View style={styles.footerContainer}>
                    <FlashcardControls
                        onNotMemorized={handleNotMemorized}
                        onMemorized={handleMemorized}
                        onFlip={handleFlip}
                        isFlipped={isFlipped}
                    />

                    <FlashcardProgress
                        total={totalCount || 20}
                        completed={completedCount}
                    />
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
    cardHintText: {
        fontSize: 13,
        color: "#8E8E93",
        fontWeight: "500",
        marginTop: 8,
        textAlign: "center",
    },
    footerContainer: {
        width: "100%",
        alignItems: "center",
        gap: 8,
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
