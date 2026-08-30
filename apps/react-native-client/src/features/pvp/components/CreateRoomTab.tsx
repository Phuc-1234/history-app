import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TextInput,
    Modal,
    FlatList,
    RefreshControl,
} from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@/theme";
import { toastService } from "@/services/toastService";
import {
    useCreatePvpRoomMutation,
    useGetCuratedTestsQuery,
    useGetAvailableQuestionsCountQuery,
} from "../services/pvpApi";
import {
    useGetGradesQuery,
    useGetTopicsByGradeQuery,
    useGetLessonsByTopicQuery,
    useGetSectionsByLessonQuery,
    useGetNodesBySectionQuery,
    useGetScopeLineageQuery,
} from "@/features/lesson_menu/contentApiSlice";
import type { PvpRoom } from "../types";

interface CreateRoomTabProps {
    onRoomCreated: (room: PvpRoom) => void;
    initialMode?: Mode;
    initialTestId?: string;
    initialScopeType?: ScopeType;
    initialScopeId?: number;
    initialQuestionCount?: number;
}

type Mode = "AUTO_PICK" | "CURATED";
type ScopeType = "NATIONAL" | "GRADE" | "TOPIC" | "LESSON" | "SECTION" | "NODE";
type PickerType = "GRADE" | "TOPIC" | "LESSON" | "SECTION" | "NODE" | null;

export function CreateRoomTab({
    onRoomCreated,
    initialMode,
    initialTestId,
    initialScopeType,
    initialScopeId,
    initialQuestionCount,
}: CreateRoomTabProps) {
    const insets = useSafeAreaInsets();

    const [mode, setMode] = useState<Mode>(
        initialMode ?? (initialTestId ? "CURATED" : "AUTO_PICK")
    );
    const [selectedTestId, setSelectedTestId] = useState<string | null>(initialTestId ?? null);

    const [scopeType, setScopeType] = useState<ScopeType>(initialScopeType ?? "NATIONAL");
    const [selectedGradeId, setSelectedGradeId] = useState<number | null>(
        initialScopeType === "GRADE" ? initialScopeId ?? null : null
    );
    const [selectedTopicId, setSelectedTopicId] = useState<number | null>(
        initialScopeType === "TOPIC" ? initialScopeId ?? null : null
    );
    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
        initialScopeType === "LESSON" ? initialScopeId ?? null : null
    );
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
        initialScopeType === "SECTION" ? initialScopeId ?? null : null
    );
    const [selectedNodeId, setSelectedNodeId] = useState<number | null>(
        initialScopeType === "NODE" ? initialScopeId ?? null : null
    );

    // Resolve hierarchy lineage if coming from an initial scope (e.g. TestIntro)
    const { data: lineageData } = useGetScopeLineageQuery(
        { scopeType: initialScopeType!, scopeId: initialScopeId! },
        { skip: !initialScopeType || !initialScopeId || initialScopeType === "NATIONAL" }
    );

    useEffect(() => {
        if (lineageData) {
            if (lineageData.gradeId !== undefined && lineageData.gradeId !== null) {
                setSelectedGradeId(lineageData.gradeId);
            }
            if (lineageData.topicId !== undefined && lineageData.topicId !== null) {
                setSelectedTopicId(lineageData.topicId);
            }
            if (lineageData.lessonId !== undefined && lineageData.lessonId !== null) {
                setSelectedLessonId(lineageData.lessonId);
            }
            if (lineageData.sectionId !== undefined && lineageData.sectionId !== null) {
                setSelectedSectionId(lineageData.sectionId);
            }
            if (lineageData.nodeId !== undefined && lineageData.nodeId !== null) {
                setSelectedNodeId(lineageData.nodeId);
            }
        }
    }, [lineageData]);

    // Collapsible states
    const [isScopeCollapsed, setIsScopeCollapsed] = useState<boolean>(true);
    const [isQuestionConfigCollapsed, setIsQuestionConfigCollapsed] = useState<boolean>(false);


    // Modal picker state
    const [activePicker, setActivePicker] = useState<PickerType>(null);

    const [questionCount, setQuestionCount] = useState<number>(initialQuestionCount ?? 10);
    const [questionCountInput, setQuestionCountInput] = useState<string>((initialQuestionCount ?? 10).toString());
    const [timePerQuestion, setTimePerQuestion] = useState<number>(15);

    const [transitionInterval, setTransitionInterval] = useState<number>(5);
    const [isPublic, setIsPublic] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [createRoomMut, { isLoading: isCreating }] = useCreatePvpRoomMutation();

    // Curated tests query
    const { data: curatedTests, isLoading: loadingTests } = useGetCuratedTestsQuery(undefined, {
        skip: mode !== "CURATED",
    });

    // Content hierarchy queries
    const { data: gradesData, isFetching: fetchingGrades } = useGetGradesQuery(undefined, {
        skip: mode !== "AUTO_PICK" || scopeType === "NATIONAL",
    });

    const showTopic = ["TOPIC", "LESSON", "SECTION", "NODE"].includes(scopeType);
    const { data: topicsData, isFetching: fetchingTopics } = useGetTopicsByGradeQuery(selectedGradeId!, {
        skip: mode !== "AUTO_PICK" || !selectedGradeId || !showTopic,
    });

    const showLesson = ["LESSON", "SECTION", "NODE"].includes(scopeType);
    const { data: lessonsData, isFetching: fetchingLessons } = useGetLessonsByTopicQuery(selectedTopicId!, {
        skip: mode !== "AUTO_PICK" || !selectedTopicId || !showLesson,
    });

    const showSection = ["SECTION", "NODE"].includes(scopeType);
    const { data: sectionsData, isFetching: fetchingSections } = useGetSectionsByLessonQuery(selectedLessonId!, {
        skip: mode !== "AUTO_PICK" || !selectedLessonId || !showSection,
    });

    const showNode = scopeType === "NODE";
    const { data: nodesData, isFetching: fetchingNodes } = useGetNodesBySectionQuery(selectedSectionId!, {
        skip: mode !== "AUTO_PICK" || !selectedSectionId || !showNode,
    });

    // Active scope ID based on scopeType
    const activeScopeId =
        scopeType === "GRADE"
            ? selectedGradeId
            : scopeType === "TOPIC"
            ? selectedTopicId
            : scopeType === "LESSON"
            ? selectedLessonId
            : scopeType === "SECTION"
            ? selectedSectionId
            : scopeType === "NODE"
            ? selectedNodeId
            : null;

    // Available questions count query
    const skipCountQuery =
        mode === "CURATED"
            ? !selectedTestId
            : scopeType !== "NATIONAL" && !activeScopeId;

    const queryParams =
        mode === "CURATED"
            ? { testId: selectedTestId ?? undefined }
            : { scopeType, scopeId: activeScopeId ?? undefined };

    const { data: countData, isFetching: fetchingCount, refetch: refetchCount } = useGetAvailableQuestionsCountQuery(
        queryParams,
        { skip: skipCountQuery }
    );

    const availableCount = countData?.availableCount ?? 0;

    // Is active modal picker loading?
    const isPickerLoading =
        (activePicker === "GRADE" && (fetchingGrades || !gradesData)) ||
        (activePicker === "TOPIC" && (fetchingTopics || !topicsData)) ||
        (activePicker === "LESSON" && (fetchingLessons || !lessonsData)) ||
        (activePicker === "SECTION" && (fetchingSections || !sectionsData)) ||
        (activePicker === "NODE" && (fetchingNodes || !nodesData));

    // Default select first curated test when loaded
    useEffect(() => {
        if (mode === "CURATED" && curatedTests && curatedTests.length > 0 && !selectedTestId) {
            setSelectedTestId(curatedTests[0].id);
        }
    }, [mode, curatedTests, selectedTestId]);

    const handleQuestionCountChange = (text: string) => {
        const digits = text.replace(/[^0-9]/g, "");
        setQuestionCountInput(digits);
        const parsed = parseInt(digits, 10);
        if (!isNaN(parsed) && parsed >= 5) {
            setQuestionCount(parsed);
        } else if (digits === "") {
            setQuestionCount(5);
        }
    };

    const handleCreate = async () => {
        try {
            setErrorMsg(null);

            if (mode === "CURATED" && !selectedTestId) {
                const msg = "Vui lòng chọn đề thi có sẵn";
                setErrorMsg(msg);
                toastService.show(msg, "error");
                return;
            }

            if (mode === "AUTO_PICK" && scopeType !== "NATIONAL" && !activeScopeId) {
                const msg = "Vui lòng chọn đầy đủ cấp phạm vi đã chọn";
                setErrorMsg(msg);
                toastService.show(msg, "error");
                return;
            }

            let finalCount = questionCount;
            if (isNaN(finalCount) || finalCount < 5) {
                finalCount = 5;
            }

            if (!skipCountQuery && availableCount < 5) {
                const msg = `Không thể tạo phòng: Phạm vi đã chọn không đủ câu hỏi (cần tối thiểu 5 câu, hiện có ${availableCount} câu)`;
                setErrorMsg(msg);
                toastService.show(msg, "error");
                return;
            }

            if (!skipCountQuery && finalCount > availableCount) {
                const msg = `Không thể tạo phòng: Số câu hỏi yêu cầu (${finalCount}) vượt quá số câu hiện có (${availableCount})`;
                setErrorMsg(msg);
                toastService.show(msg, "error");
                return;
            }

            const autoNext = transitionInterval > 0;
            const room = await createRoomMut({
                questionCount: finalCount,
                timePerQuestion,
                autoNext,
                transitionInterval,
                isPublic,
                testId: mode === "CURATED" ? selectedTestId ?? undefined : undefined,
                scopeType: mode === "AUTO_PICK" ? scopeType : undefined,
                scopeId: mode === "AUTO_PICK" ? activeScopeId ?? undefined : undefined,
            }).unwrap();

            onRoomCreated(room);
        } catch (err: any) {
            console.error("Failed to create room:", err);
            const msg = err?.data?.error ?? err?.message ?? "Không thể tạo phòng";
            setErrorMsg(msg);
            toastService.show(msg, "error");
        }
    };

    // Helper text for collapsed scope summary
    const getScopeSummaryText = () => {
        if (mode === "CURATED") {
            const test = curatedTests?.find((t) => t.id === selectedTestId);
            return test ? `Đề có sẵn: ${test.title}` : "Đề thi có sẵn";
        }

        if (scopeType === "NATIONAL") return "Đề tự sinh: Toàn bộ ngân hàng";

        if (scopeType === "GRADE") {
            return selectedGradeId ? `Lớp ${selectedGradeId}` : "Chưa chọn lớp";
        }
        if (scopeType === "TOPIC") {
            const topic = topicsData?.topics.find((t: any) => t.id === selectedTopicId);
            return topic?.name ?? (selectedGradeId ? `Lớp ${selectedGradeId}` : "Chưa chọn chủ đề");
        }
        if (scopeType === "LESSON") {
            const lesson = lessonsData?.lessons.find((l: any) => l.id === selectedLessonId);
            return lesson?.name ?? "Chưa chọn bài học";
        }
        if (scopeType === "SECTION") {
            const section = sectionsData?.sections.find((s: any) => s.id === selectedSectionId);
            return section?.name ?? "Chưa chọn mục";
        }
        if (scopeType === "NODE") {
            const node = nodesData?.nodes.find((n: any) => n.id === selectedNodeId);
            return node?.header ?? (selectedSectionId ? `Phần thuộc mục ${selectedSectionId}` : "Chưa chọn phần");
        }

        return "Phạm vi câu hỏi";
    };

    // Modal Item list generator
    const getModalItems = () => {
        if (activePicker === "GRADE") {
            return (gradesData?.grades ?? []).map((g: any) => ({
                id: g.id,
                title: `Lớp ${g.id}`,
            }));
        }
        if (activePicker === "TOPIC") {
            return (topicsData?.topics ?? []).map((t: any) => ({
                id: t.id,
                title: t.name,
            }));
        }
        if (activePicker === "LESSON") {
            return (lessonsData?.lessons ?? []).map((l: any) => ({
                id: l.id,
                title: l.name,
            }));
        }
        if (activePicker === "SECTION") {
            return (sectionsData?.sections ?? []).map((s: any) => ({
                id: s.id,
                title: s.name,
            }));
        }
        if (activePicker === "NODE") {
            return (nodesData?.nodes ?? []).map((n: any) => ({
                id: n.id,
                title: n.header ?? `Mục ${n.id}`,
            }));
        }
        return [];
    };

    const handleSelectModalItem = (itemId: number) => {
        if (activePicker === "GRADE") {
            setSelectedGradeId(itemId);
            setSelectedTopicId(null);
            setSelectedLessonId(null);
            setSelectedSectionId(null);
            setSelectedNodeId(null);
        } else if (activePicker === "TOPIC") {
            setSelectedTopicId(itemId);
            setSelectedLessonId(null);
            setSelectedSectionId(null);
            setSelectedNodeId(null);
        } else if (activePicker === "LESSON") {
            setSelectedLessonId(itemId);
            setSelectedSectionId(null);
            setSelectedNodeId(null);
        } else if (activePicker === "SECTION") {
            setSelectedSectionId(itemId);
            setSelectedNodeId(null);
        } else if (activePicker === "NODE") {
            setSelectedNodeId(itemId);
        }
        setActivePicker(null);
    };

    const getPickerTitle = () => {
        switch (activePicker) {
            case "GRADE":
                return "Chọn Lớp";
            case "TOPIC":
                return "Chọn Chủ đề";
            case "LESSON":
                return "Chọn Bài học";
            case "SECTION":
                return "Chọn Mục";
            case "NODE":
                return "Chọn Phần";
            default:
                return "";
        }
    };

    const getActiveItemId = () => {
        switch (activePicker) {
            case "GRADE":
                return selectedGradeId;
            case "TOPIC":
                return selectedTopicId;
            case "LESSON":
                return selectedLessonId;
            case "SECTION":
                return selectedSectionId;
            case "NODE":
                return selectedNodeId;
            default:
                return null;
        }
    };

    return (
        <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={fetchingCount}
                    onRefresh={() => refetchCount()}
                    colors={[colors.orange || "#FF9500"]}
                    tintColor={colors.orange || "#FF9500"}
                />
            }
        >
            <Text style={styles.title}>Cấu hình phòng thi đấu</Text>

            {/* Public / Private Room Toggle */}
            <View style={styles.privacyRow}>
                <TouchableOpacity
                    style={[styles.privacyPill, isPublic && styles.privacyPillActive]}
                    onPress={() => setIsPublic(true)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.privacyPillText, isPublic && styles.privacyPillTextActive]}>
                        Công khai
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.privacyPill, !isPublic && styles.privacyPillActive]}
                    onPress={() => setIsPublic(false)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.privacyPillText, !isPublic && styles.privacyPillTextActive]}>
                        Riêng tư
                    </Text>
                </TouchableOpacity>
            </View>

            {/* CONTAINER 1: Scope & Test selection (Collapsible, collapsed by default) */}
            <View style={styles.cardContainer}>
                <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => setIsScopeCollapsed(!isScopeCollapsed)}
                    activeOpacity={0.8}
                >
                    <View style={styles.headerLeft}>
                        <Text style={styles.cardTitle}>Phạm vi & Đề thi</Text>
                        {isScopeCollapsed && (
                            <Text style={styles.cardSubSummary} numberOfLines={1}>
                                {getScopeSummaryText()}
                            </Text>
                        )}
                    </View>
                    <View style={styles.headerRight}>
                        {fetchingCount ? (
                            <ActivityIndicator size="small" color={colors.primary600} />
                        ) : !skipCountQuery ? (
                            <View style={styles.badgeContainer}>
                                <Text style={styles.badgeText}>có {availableCount} câu</Text>
                            </View>
                        ) : null}
                        {isScopeCollapsed ? (
                            <ChevronDown size={18} color={colors.neutral500} />
                        ) : (
                            <ChevronUp size={18} color={colors.neutral500} />
                        )}
                    </View>
                </TouchableOpacity>

                {!isScopeCollapsed && (
                    <View style={styles.cardBody}>
                        {/* Mode Selection */}
                        <Text style={styles.label}>Chế độ câu hỏi</Text>
                        <View style={styles.optionsRow}>
                            {[
                                { key: "AUTO_PICK" as Mode, label: "Đề tự sinh" },
                                { key: "CURATED" as Mode, label: "Đề thi có sẵn" },
                            ].map((opt) => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[styles.pill, mode === opt.key && styles.pillActive]}
                                    onPress={() => setMode(opt.key)}
                                >
                                    <Text
                                        style={[styles.pillText, mode === opt.key && styles.pillTextActive]}
                                        numberOfLines={1}
                                    >
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* CURATED MODE */}
                        {mode === "CURATED" && (
                            <View style={styles.sectionBlock}>
                                <Text style={styles.label}>Chọn đề thi có sẵn</Text>
                                {loadingTests ? (
                                    <ActivityIndicator style={{ marginVertical: spacing.sm }} color={colors.primary600} />
                                ) : (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                        {curatedTests?.map((t) => (
                                            <TouchableOpacity
                                                key={t.id}
                                                style={[styles.cardPill, selectedTestId === t.id && styles.cardPillActive]}
                                                onPress={() => setSelectedTestId(t.id)}
                                            >
                                                <Text style={[styles.cardPillTitle, selectedTestId === t.id && styles.pillTextActive]}>
                                                    {t.title}
                                                </Text>
                                                <Text style={[styles.cardPillSub, selectedTestId === t.id && styles.pillTextActive]}>
                                                    (có {t.questionCount} câu)
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        )}

                        {/* AUTO_PICK MODE: Scope Type selection & Cascading Modal Pickers */}
                        {mode === "AUTO_PICK" && (
                            <View style={styles.sectionBlock}>
                                <Text style={styles.label}>Phạm vi câu hỏi (Scope)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                    {[
                                        { key: "NATIONAL" as ScopeType, label: "Tất cả" },
                                        { key: "GRADE" as ScopeType, label: "Lớp" },
                                        { key: "TOPIC" as ScopeType, label: "Chủ đề" },
                                        { key: "LESSON" as ScopeType, label: "Bài học" },
                                        { key: "SECTION" as ScopeType, label: "Mục" },
                                        { key: "NODE" as ScopeType, label: "Phần" },
                                    ].map((s) => (
                                        <TouchableOpacity
                                            key={s.key}
                                            style={[styles.compactPill, scopeType === s.key && styles.pillActive, { marginRight: spacing.xs }]}
                                            onPress={() => {
                                                setScopeType(s.key);
                                                setSelectedGradeId(null);
                                                setSelectedTopicId(null);
                                                setSelectedLessonId(null);
                                                setSelectedSectionId(null);
                                                setSelectedNodeId(null);
                                            }}
                                        >
                                            <Text
                                                style={[styles.pillText, scopeType === s.key && styles.pillTextActive]}
                                                numberOfLines={1}
                                            >
                                                {s.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {/* Modal Trigger Buttons */}
                                {scopeType !== "NATIONAL" && (
                                    <View style={styles.pickerRowGroup}>
                                        {/* Grade Trigger */}
                                        <TouchableOpacity
                                            style={styles.pickerTrigger}
                                            onPress={() => setActivePicker("GRADE")}
                                        >
                                            <Text style={styles.pickerTriggerLabel}>Lớp:</Text>
                                            <Text style={styles.pickerTriggerValue}>
                                                {selectedGradeId ? `Lớp ${selectedGradeId}` : "Bấm để chọn lớp"}
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Topic Trigger */}
                                        {showTopic && (
                                            <TouchableOpacity
                                                style={[styles.pickerTrigger, !selectedGradeId && styles.pickerTriggerDisabled]}
                                                onPress={() => selectedGradeId && setActivePicker("TOPIC")}
                                                disabled={!selectedGradeId}
                                            >
                                                <Text style={styles.pickerTriggerLabel}>Chủ đề:</Text>
                                                <Text style={styles.pickerTriggerValue}>
                                                    {topicsData?.topics.find((t: any) => t.id === selectedTopicId)?.name ??
                                                        (fetchingTopics && selectedTopicId ? "Đang tải..." : "Bấm để chọn chủ đề")}
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Lesson Trigger */}
                                        {showLesson && (
                                            <TouchableOpacity
                                                style={[styles.pickerTrigger, !selectedTopicId && styles.pickerTriggerDisabled]}
                                                onPress={() => selectedTopicId && setActivePicker("LESSON")}
                                                disabled={!selectedTopicId}
                                            >
                                                <Text style={styles.pickerTriggerLabel}>Bài học:</Text>
                                                <Text style={styles.pickerTriggerValue}>
                                                    {lessonsData?.lessons.find((l: any) => l.id === selectedLessonId)?.name ??
                                                        (fetchingLessons && selectedLessonId ? "Đang tải..." : "Bấm để chọn bài học")}
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Section Trigger */}
                                        {showSection && (
                                            <TouchableOpacity
                                                style={[styles.pickerTrigger, !selectedLessonId && styles.pickerTriggerDisabled]}
                                                onPress={() => selectedLessonId && setActivePicker("SECTION")}
                                                disabled={!selectedLessonId}
                                            >
                                                <Text style={styles.pickerTriggerLabel}>Mục:</Text>
                                                <Text style={styles.pickerTriggerValue}>
                                                    {sectionsData?.sections.find((s: any) => s.id === selectedSectionId)?.name ??
                                                        (fetchingSections && selectedSectionId ? "Đang tải..." : "Bấm để chọn mục")}
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Node Trigger */}
                                        {showNode && (
                                            <TouchableOpacity
                                                style={[styles.pickerTrigger, !selectedSectionId && styles.pickerTriggerDisabled]}
                                                onPress={() => selectedSectionId && setActivePicker("NODE")}
                                                disabled={!selectedSectionId}
                                            >
                                                <Text style={styles.pickerTriggerLabel}>Phần:</Text>
                                                <Text style={styles.pickerTriggerValue}>
                                                    {nodesData?.nodes.find((n: any) => n.id === selectedNodeId)?.header ??
                                                        (fetchingNodes && selectedNodeId ? "Đang tải..." : "Bấm để chọn phần")}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* CONTAINER 2: Question count & time per question (Collapsible, uncollapsed by default) */}
            <View style={styles.cardContainer}>
                <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => setIsQuestionConfigCollapsed(!isQuestionConfigCollapsed)}
                    activeOpacity={0.8}
                >
                    <View style={styles.headerLeft}>
                        <Text style={styles.cardTitle}>Cấu hình câu hỏi</Text>
                        {isQuestionConfigCollapsed && (
                            <Text style={styles.cardSubSummary}>
                                {questionCount} câu • {timePerQuestion}s/câu • chuyển: {transitionInterval === 0 ? "không có" : `${transitionInterval}s`}
                            </Text>
                        )}
                    </View>
                    {isQuestionConfigCollapsed ? (
                        <ChevronDown size={18} color={colors.neutral500} />
                    ) : (
                        <ChevronUp size={18} color={colors.neutral500} />
                    )}
                </TouchableOpacity>

                {!isQuestionConfigCollapsed && (
                    <View style={styles.cardBody}>
                        {/* Question Count Selection */}
                        <Text style={styles.label}>Số lượng câu hỏi</Text>
                        <View style={styles.optionsRow}>
                            {[5, 10, 15, 20].map((cnt) => (
                                <TouchableOpacity
                                    key={cnt}
                                    style={[
                                        styles.compactPill,
                                        questionCount === cnt && styles.pillActive,
                                        availableCount > 0 && cnt > availableCount && styles.pillDisabled,
                                    ]}
                                    onPress={() => {
                                        setQuestionCount(cnt);
                                        setQuestionCountInput(cnt.toString());
                                    }}
                                    disabled={availableCount > 0 && cnt > availableCount}
                                >
                                    <Text
                                        style={[
                                            styles.pillText,
                                            questionCount === cnt && styles.pillTextActive,
                                            availableCount > 0 && cnt > availableCount && styles.pillTextDisabled,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {cnt} câu
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Typed Number Input */}
                        <View style={styles.typedInputRow}>
                            <Text style={styles.subLabel}>Hoặc nhập số lượng tùy chọn:</Text>
                            <TextInput
                                style={styles.numericInput}
                                keyboardType="numeric"
                                value={questionCountInput}
                                onChangeText={handleQuestionCountChange}
                            />
                        </View>

                        {availableCount > 0 && questionCount > availableCount ? (
                            <Text style={styles.warningText}>
                                Lưu ý: Phạm vi chỉ có {availableCount} câu. Phòng sẽ tự động giới hạn ở {availableCount} câu.
                            </Text>
                        ) : null}

                        {/* Time Per Question Selection */}
                        <Text style={styles.label}>Thời gian mỗi câu</Text>
                        <View style={styles.optionsRow}>
                            {[10, 15, 30].map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.compactPill, timePerQuestion === t && styles.pillActive]}
                                    onPress={() => setTimePerQuestion(t)}
                                >
                                    <Text
                                        style={[styles.pillText, timePerQuestion === t && styles.pillTextActive]}
                                        numberOfLines={1}
                                    >
                                        {t} giây
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Transition Interval Selection */}
                        <Text style={styles.label}>Thời gian chuyển câu</Text>
                        <View style={styles.optionsRow}>
                            {([0, 3, 5, 8, 12] as number[]).map((sec) => (
                                <TouchableOpacity
                                    key={sec}
                                    style={[styles.compactPill, transitionInterval === sec && styles.pillActive]}
                                    onPress={() => setTransitionInterval(sec)}
                                >
                                    <Text
                                        style={[styles.pillText, transitionInterval === sec && styles.pillTextActive]}
                                        numberOfLines={1}
                                    >
                                        {sec === 0 ? "Không có" : `${sec} giây`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>


            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <TouchableOpacity
                style={[styles.submitButton, isCreating && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={isCreating}
            >
                {isCreating ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.submitButtonText}>Tạo phòng mới</Text>
                )}
            </TouchableOpacity>

            {/* Cascading Scope Selection Modal Drawer */}
            <Modal
                visible={activePicker !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setActivePicker(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{getPickerTitle()}</Text>
                            <TouchableOpacity onPress={() => setActivePicker(null)}>
                                <Text style={styles.modalCloseText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>

                        {isPickerLoading ? (
                            <View style={styles.skeletonContainer}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <View key={i} style={styles.skeletonRow}>
                                        <View style={styles.skeletonBar} />
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <FlatList
                                data={getModalItems()}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={styles.modalList}
                                renderItem={({ item }) => {
                                    const isSelected = getActiveItemId() === item.id;
                                    return (
                                        <TouchableOpacity
                                            style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                                            onPress={() => handleSelectModalItem(item.id)}
                                        >
                                            <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                                                {item.title}
                                            </Text>
                                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
    },
    container: {
        padding: spacing.lg,
        paddingBottom: spacing.xl * 2,
    },
    title: {
        fontSize: 22,
        fontFamily: typography.fonts.extraBold,
        color: colors.neutral900,
        marginBottom: spacing.xs,
        textAlign: "center",
    },
    privacyRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.neutral100,
        borderRadius: radii.pill,
        padding: spacing.xs,
        marginBottom: spacing.md,
        alignSelf: "center",
        width: 220,
    },
    privacyPill: {
        flex: 1,
        paddingVertical: spacing.xs + 2,
        borderRadius: radii.pill,
        alignItems: "center",
    },
    privacyPillActive: {
        backgroundColor: colors.primary600,
    },
    privacyPillText: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.neutral600,
    },
    privacyPillTextActive: {
        color: "#FFFFFF",
        fontFamily: typography.fonts.bold,
    },
    cardContainer: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg, // 12
        borderWidth: 1,
        borderColor: colors.neutral200,
        marginBottom: spacing.md,
        overflow: "hidden",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 4,
        backgroundColor: colors.neutral50,
    },
    headerLeft: {
        flex: 1,
        marginRight: spacing.sm,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    cardTitle: {
        fontSize: 15,
        fontFamily: typography.fonts.bold,
        color: colors.neutral900,
    },
    cardSubSummary: {
        fontSize: 12,
        fontFamily: typography.fonts.regular,
        color: colors.neutral600,
        marginTop: 2,
    },
    cardBody: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.neutral200,
    },
    label: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.neutral700,
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
    },
    subLabel: {
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        color: colors.neutral600,
        marginBottom: spacing.xs,
    },
    sectionBlock: {
        marginTop: spacing.xs,
    },
    horizontalScroll: {
        flexDirection: "row",
        marginVertical: spacing.xs,
    },
    optionsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs + 2, // 6px gap for compact fit
    },
    pill: {
        paddingVertical: spacing.xs + 2,
        paddingHorizontal: spacing.sm + 2,
        borderRadius: radii.pill, // 30
        borderWidth: 1,
        borderColor: colors.neutral300,
        backgroundColor: colors.neutral100,
        alignItems: "center",
        justifyContent: "center",
    },
    compactPill: {
        paddingVertical: spacing.xs + 2,
        paddingHorizontal: spacing.sm + 2,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.neutral300,
        backgroundColor: colors.neutral100,
        alignItems: "center",
        justifyContent: "center",
    },
    pillActive: {
        backgroundColor: colors.primary600,
        borderColor: colors.primary600,
    },
    pillDisabled: {
        opacity: 0.4,
        backgroundColor: colors.neutral200,
    },
    pillText: {
        fontSize: 13,
        fontFamily: typography.fonts.medium,
        color: colors.neutral700,
    },
    pillTextActive: {
        color: "#FFFFFF",
    },
    pillTextDisabled: {
        color: colors.neutral500,
    },
    cardPill: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.neutral300,
        backgroundColor: colors.neutral100,
        marginRight: spacing.sm,
        minWidth: 120,
    },
    cardPillActive: {
        backgroundColor: colors.primary600,
        borderColor: colors.primary600,
    },
    cardPillTitle: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.neutral800,
    },
    cardPillSub: {
        fontSize: 12,
        fontFamily: typography.fonts.regular,
        color: colors.neutral600,
        marginTop: 2,
    },
    badgeContainer: {
        backgroundColor: colors.successContainer,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: spacing.xs,
        borderRadius: radii.pill,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: typography.fonts.medium,
        color: colors.textSuccess,
    },
    pickerRowGroup: {
        marginTop: spacing.xs,
        gap: spacing.xs,
    },
    pickerTrigger: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.neutral100,
        borderWidth: 1,
        borderColor: colors.neutral300,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    pickerTriggerDisabled: {
        opacity: 0.5,
        backgroundColor: colors.neutral200,
    },
    pickerTriggerLabel: {
        fontSize: 13,
        fontFamily: typography.fonts.bold,
        color: colors.neutral800,
        marginRight: spacing.xs,
    },
    pickerTriggerValue: {
        flex: 1,
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        color: colors.primary600,
    },
    typedInputRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: spacing.sm,
    },
    numericInput: {
        borderWidth: 1,
        borderColor: colors.neutral300,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.neutral900,
        width: 80,
        textAlign: "center",
        backgroundColor: colors.neutral50,
    },
    warningText: {
        fontSize: 12,
        fontFamily: typography.fonts.regular,
        color: colors.textWarning,
        marginTop: spacing.xs,
    },
    errorText: {
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        color: colors.error600,
        marginTop: spacing.sm,
    },
    submitButton: {
        backgroundColor: colors.primary600,
        borderRadius: radii.pill,
        paddingVertical: spacing.md,
        alignItems: "center",
        marginTop: spacing.md,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 15,
        fontFamily: typography.fonts.medium,
        color: "#FFFFFF",
    },
    // Modal & Skeleton Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: radii.lg * 1.5,
        borderTopRightRadius: radii.lg * 1.5,
        maxHeight: "70%",
        padding: spacing.md,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral200,
    },
    modalTitle: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: colors.neutral900,
    },
    modalCloseText: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.primary600,
    },
    modalList: {
        paddingVertical: spacing.sm,
    },
    modalItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral100,
    },
    modalItemSelected: {
        backgroundColor: colors.primaryContainer,
        borderRadius: radii.sm,
    },
    modalItemText: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.neutral800,
        flex: 1,
    },
    modalItemTextSelected: {
        fontFamily: typography.fonts.bold,
        color: colors.primary600,
    },
    checkmark: {
        fontSize: 16,
        color: colors.primary600,
        fontFamily: typography.fonts.bold,
    },
    skeletonContainer: {
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    skeletonRow: {
        height: 40,
        backgroundColor: colors.neutral100,
        borderRadius: radii.sm,
        justifyContent: "center",
        paddingHorizontal: spacing.sm,
    },
    skeletonBar: {
        height: 16,
        width: "60%",
        backgroundColor: colors.neutral200,
        borderRadius: 4,
    },
});
