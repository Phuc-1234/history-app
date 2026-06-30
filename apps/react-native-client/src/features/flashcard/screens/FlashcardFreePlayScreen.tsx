import React, { useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { FlashcardCard } from "../components/FlashcardCard";
import { FreeFlashcardControls } from "../components/FreeFlashcardControls";
import { CustomModal } from "@/components/Modal";
import { useGetFlashcardsByLessonQuery, useGetFlashcardsBySectionQuery, useGetFlashcardsByNodeQuery } from "../flashcardApiSlice";

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

    const handleJumpTo = (index: number) => {
        if (index === currentIndex) return;
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex(index);
        }, 150);
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
            {/* --- Complete Button (top right) --- */}
            <View style={styles.topBar}>
                <View style={styles.topBarSpacer} />
                <Text style={styles.cardCounterTopText}>
                    {currentIndex + 1} / {totalCount}
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
                    onMarkMemorized={handleMarkMemorized}
                    onMarkNotMemorized={handleMarkNotMemorized}
                    isFlipped={isFlipped}
                    hasPrev={currentIndex > 0}
                    hasNext={currentIndex < totalCount - 1}
                    isMemorized={isCurrentMemorized}
                />

                {/* --- Dot indicators --- */}
                <View style={styles.dotsContainer}>
                    {cards.map((card, index) => {
                        const isActive = index === currentIndex;
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
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
    },
    topBarSpacer: {
        flex: 1,
    },
    cardCounterTopText: {
        fontSize: 15,
        color: "#5856D6",
        fontWeight: "700",
        textAlign: "center",
        flex: 1,
    },
    completeButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#5856D6",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        flex: 1,
        justifyContent: "center",
    },
    completeButtonText: {
        fontSize: 13,
        fontWeight: "700",
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
    dotMemorized: {
        backgroundColor: "#34C759",
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
