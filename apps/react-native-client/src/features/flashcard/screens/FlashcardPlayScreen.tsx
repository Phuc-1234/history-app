import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { FlashcardCard } from "../components/FlashcardCard";
import { FlashcardControls } from "../components/FlashcardControls";
import { FlashcardProgress } from "../components/FlashcardProgress";
import { useGetFlashcardsByLessonQuery, useGetFlashcardsBySectionQuery, useGetFlashcardsByNodeQuery } from "../flashcardApiSlice";
import { CardState } from "../types";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

interface FlashcardPlayScreenProps {
    lessonId?: number;
    sectionId?: number;
    nodeId?: number;
}

export default function FlashcardPlayScreen({ lessonId, sectionId, nodeId }: FlashcardPlayScreenProps) {
    const router = useRouter();

    // Fetch flashcards from API
    const {
        data: lessonFlashcards,
        isLoading: isLessonLoading,
        isFetching: isLessonFetching,
        isError: isLessonError,
        error: lessonError,
        refetch: refetchLesson,
    } = useGetFlashcardsByLessonQuery(lessonId!, {
        skip: !lessonId,
    });

    const {
        data: sectionFlashcards,
        isLoading: isSectionLoading,
        isFetching: isSectionFetching,
        isError: isSectionError,
        error: sectionError,
        refetch: refetchSection,
    } = useGetFlashcardsBySectionQuery(sectionId!, {
        skip: !sectionId,
    });

    const {
        data: nodeFlashcards,
        isLoading: isNodeLoading,
        isFetching: isNodeFetching,
        isError: isNodeError,
        error: nodeError,
        refetch: refetchNode,
    } = useGetFlashcardsByNodeQuery(nodeId!, {
        skip: !nodeId,
    });

    const flashcards = lessonId ? lessonFlashcards : (sectionId ? sectionFlashcards : nodeFlashcards);
    const isLoading = lessonId ? isLessonLoading : (sectionId ? isSectionLoading : isNodeLoading);
    const isFetching = lessonId ? isLessonFetching : (sectionId ? isSectionFetching : isNodeFetching);
    const isError = lessonId ? isLessonError : (sectionId ? isSectionError : isNodeError);
    const error = lessonId ? lessonError : (sectionId ? sectionError : nodeError);
    const refetch = lessonId ? refetchLesson : (sectionId ? refetchSection : refetchNode);

    const onRefresh = async () => {
        if (refetch) {
            await refetch();
        }
    };

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

    const safeIndex = incompleteCards.length > 0 ? Math.max(0, Math.min(currentIndex, incompleteCards.length - 1)) : 0;
    const currentCardState = incompleteCards[safeIndex] || null;

    const handleFlip = () => {
        setIsFlipped((prev) => !prev);
    };

    const handleNotMemorized = () => {
        if (!currentCardState) return;

        setIsFlipped(false);
        if (incompleteCards.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % incompleteCards.length);
        }
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
        setDeck(updatedDeck);

        const wasCompleted = newMemorizedCount >= 2;
        if (wasCompleted) {
            setCurrentIndex((prev) => prev % nextIncomplete.length);
        } else {
            setCurrentIndex((prev) => (prev + 1) % nextIncomplete.length);
        }
    };

    // --- Loading state ---
    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải thẻ lật...</Text>
            </View>
        );
    }

    // --- Error state ---
    if (isError) {
        return (
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.centerContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={Boolean(isFetching)}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                <Ionicons name="warning-outline" size={48} color="#FF9800" style={{ marginBottom: 16 }} />
                <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
                <Text style={styles.errorText}>
                    Vui lòng kiểm tra kết nối mạng và vuốt xuống để thử lại.
                </Text>
            </ScrollView>
        );
    }

    // --- Empty state (API returns []) ---
    if (!flashcards || flashcards.length === 0) {
        return (
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.centerContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={Boolean(isFetching)}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                <Ionicons name="mail-open-outline" size={48} color="#9C94A6" style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>Chưa có thẻ lật</Text>
                <Text style={styles.emptyText}>
                    Bài học này chưa có thẻ lật nào. Hãy vuốt xuống để làm mới nhé!
                </Text>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={Boolean(isFetching && !isLoading)}
                    onRefresh={onRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                />
            }
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
        >
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContentContainer: {
        flexGrow: 1,
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 14,
    },
    cardArea: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    cardHintText: {
        ...typography.bodySmallMedium,
        color: colors.textMuted,
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
        backgroundColor: colors.background,
    },
    loadingText: {
        ...typography.bodyMediumMedium,
        color: colors.textMuted,
        marginTop: 16,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    errorText: {
        ...typography.bodyMedium,
        color: colors.textMuted,
        textAlign: "center",
        lineHeight: 20,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    emptyText: {
        ...typography.bodyMedium,
        color: colors.textMuted,
        textAlign: "center",
        lineHeight: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
