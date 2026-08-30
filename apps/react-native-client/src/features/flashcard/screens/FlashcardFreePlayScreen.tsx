import React, { useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { FlashcardCard } from "../components/FlashcardCard";
import { FreeFlashcardControls } from "../components/FreeFlashcardControls";
import { CustomModal } from "@/components/Modal";
import { useGetFlashcardsByLessonQuery, useGetFlashcardsBySectionQuery, useGetFlashcardsByNodeQuery } from "../flashcardApiSlice";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

interface FlashcardFreePlayScreenProps {
    lessonId?: number;
    sectionId?: number;
    nodeId?: number;
}

export default function FlashcardFreePlayScreen({ lessonId, sectionId, nodeId }: FlashcardFreePlayScreenProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [memorizedSet, setMemorizedSet] = useState<Set<string>>(new Set());
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Fetch flashcards from API
    const {
        data: lessonCards,
        isLoading: isLessonLoading,
        isFetching: isLessonFetching,
        isError: isLessonError,
        refetch: refetchLesson,
    } = useGetFlashcardsByLessonQuery(lessonId!, {
        skip: !lessonId,
    });

    const {
        data: sectionCards,
        isLoading: isSectionLoading,
        isFetching: isSectionFetching,
        isError: isSectionError,
        refetch: refetchSection,
    } = useGetFlashcardsBySectionQuery(sectionId!, {
        skip: !sectionId,
    });

    const {
        data: nodeCards,
        isLoading: isNodeLoading,
        isFetching: isNodeFetching,
        isError: isNodeError,
        refetch: refetchNode,
    } = useGetFlashcardsByNodeQuery(nodeId!, {
        skip: !nodeId,
    });

    const cards = lessonId ? lessonCards : (sectionId ? sectionCards : nodeCards);
    const isLoading = lessonId ? isLessonLoading : (sectionId ? isSectionLoading : isNodeLoading);
    const isFetching = lessonId ? isLessonFetching : (sectionId ? isSectionFetching : isNodeFetching);
    const isError = lessonId ? isLessonError : (sectionId ? isSectionError : isNodeError);
    const refetch = lessonId ? refetchLesson : (sectionId ? refetchSection : refetchNode);

    const onRefresh = async () => {
        if (refetch) {
            await refetch();
        }
    };

    const totalCount = cards?.length ?? 0;
    const safeCurrentIndex = totalCount > 0 ? Math.max(0, Math.min(currentIndex, totalCount - 1)) : 0;
    const currentCard = cards?.[safeCurrentIndex] ?? null;

    const handleFlip = () => {
        setIsFlipped((prev) => !prev);
    };

    const handlePrev = () => {
        if (safeCurrentIndex <= 0) return;
        setIsFlipped(false);
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        if (safeCurrentIndex >= totalCount - 1) return;
        setIsFlipped(false);
        setCurrentIndex((prev) => Math.min(Math.max(0, totalCount - 1), prev + 1));
    };

    const handleJumpTo = (index: number) => {
        const clamped = Math.max(0, Math.min(index, Math.max(0, totalCount - 1)));
        if (clamped === safeCurrentIndex) return;
        setIsFlipped(false);
        setCurrentIndex(clamped);
    };

    const handleMarkMemorized = () => {
        if (!currentCard) return;
        setMemorizedSet((prev) => {
            const next = new Set(prev);
            next.add(currentCard.id);
            return next;
        });
    };

    const handleMarkNotMemorized = () => {
        if (!currentCard) return;
        setMemorizedSet((prev) => {
            const next = new Set(prev);
            next.delete(currentCard.id);
            return next;
        });
    };

    const handleExit = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/lesson" as any);
        }
    };

    const handleComplete = () => {
        const allMemorized = cards ? cards.every((c) => memorizedSet.has(c.id)) : false;
        if (allMemorized) {
            handleExit();
        } else {
            setShowExitConfirm(true);
        }
    };

    const isCurrentMemorized = currentCard ? memorizedSet.has(currentCard.id) : false;

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
    if (!cards || cards.length === 0) {
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
            {/* --- Complete Button (top right) --- */}
            <View style={styles.topBar}>
                <View style={styles.topBarSpacer} />
                <Text style={styles.cardCounterTopText}>
                    {totalCount > 0 ? safeCurrentIndex + 1 : 0} / {totalCount}
                </Text>
                <TouchableOpacity
                    style={styles.completeButton}
                    onPress={handleComplete}
                    activeOpacity={0.7}
                >
                    <Text style={styles.completeButtonText}>Hoàn thành</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* --- Flashcard Display --- */}
            {currentCard ? (
                <View style={styles.cardArea}>
                    <FlashcardCard
                        card={currentCard}
                        isFlipped={isFlipped}
                        onFlip={handleFlip}
                    />
                </View>
            ) : (
                <View style={styles.cardArea}>
                    <View style={styles.cardPlaceholder}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.loadingCardText}>Đang tải thẻ...</Text>
                    </View>
                </View>
            )}

            {/* --- Bottom controls --- */}
            <View style={styles.footerContainer}>
                <FreeFlashcardControls
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onFlip={handleFlip}
                    onMarkMemorized={handleMarkMemorized}
                    onMarkNotMemorized={handleMarkNotMemorized}
                    isFlipped={isFlipped}
                    hasPrev={safeCurrentIndex > 0}
                    hasNext={safeCurrentIndex < totalCount - 1}
                    isMemorized={isCurrentMemorized}
                />

                {/* --- Dot indicators --- */}
                <View style={styles.dotsContainer}>
                    {cards.map((card, index) => {
                        const isActive = index === safeCurrentIndex;
                        const isCardMemorized = memorizedSet.has(card.id);

                        return (
                            <TouchableOpacity
                                key={card.id}
                                style={[
                                    styles.dot,
                                    isActive
                                        ? styles.dotActive
                                        : isCardMemorized
                                        ? styles.dotMemorized
                                        : styles.dotInactive,
                                ]}
                                onPress={() => handleJumpTo(index)}
                                activeOpacity={0.7}
                            />
                        );
                    })}
                </View>
            </View>

            {/* --- Exit Confirmation Modal --- */}
            <CustomModal
                visible={showExitConfirm}
                title="Chưa hoàn thành"
                message="Bạn còn thẻ chưa học thuộc. Bạn có muốn thoát không?"
                confirmText="Thoát"
                cancelText="Tiếp tục học"
                onConfirm={() => {
                    setShowExitConfirm(false);
                    handleExit();
                }}
                onCancel={() => setShowExitConfirm(false)}
            />
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
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 2,
    },
    topBarSpacer: {
        flex: 1,
    },
    cardCounterTopText: {
        ...typography.bodyLargeBold,
        color: colors.primary,
        textAlign: "center",
        flex: 1,
    },
    completeButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 30,
        flex: 1,
        justifyContent: "center",
    },
    completeButtonText: {
        ...typography.bodySmallSemiBold,
        color: "#FFF",
    },
    cardArea: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    footerContainer: {
        width: "100%",
        alignItems: "center",
        gap: 4,
    },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 20,
        marginBottom: 4,
        flexWrap: "wrap",
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        backgroundColor: colors.primary,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    dotMemorized: {
        backgroundColor: colors.success,
    },
    dotInactive: {
        backgroundColor: colors.borderMedium,
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
    cardPlaceholder: {
        width: "75%",
        aspectRatio: 0.8,
        borderRadius: 12,
        backgroundColor: colors.surfaceVariant,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    loadingCardText: {
        ...typography.bodySmallMedium,
        color: colors.textMuted,
    },
});
