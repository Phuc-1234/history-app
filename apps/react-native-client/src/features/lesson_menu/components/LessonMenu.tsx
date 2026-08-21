import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    TouchableOpacity,
    Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Book } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { useRouter } from "expo-router";
import { useAppSelector } from "../../../store/storeHook";
import { useLessonMenu } from "../hooks/useLessonMenu";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { Card } from "../../../components/Card";
import Button from "../../../components/Button";
import { CustomModal } from "../../../components/Modal";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import FeedbackModal from "../../../components/FeedbackModal";

import {
    useGetTopicsByGradeQuery,
    useGetLessonsByTopicQuery,
    useGetSectionsByLessonQuery,
    useGetGradesQuery,
} from "../contentApiSlice";
import { useGetTestInfoQuery } from "../../test_v2/services/testApi";
import { PremiumModal } from "../../../components/PremiumModal";
import { SlidingTabBar } from "../../../components/SlidingTabBar";
import { PracticeSection } from "../../practice";

interface LessonMenuProps {
    selectedGrade: number;
    onLessonPress: (id: number) => void;
    onMindmapPress: (topicId: number) => void;
    onTestPress: (scopeType: string, scopeId: number) => void;
    onPracticePress: (options: { scopeType: string; scopeId?: number; questionCount: number; autoPickStrategy: string }) => void;
}

/** Small progress ring at the end of the card */
function SmallProgressRing({ pct, isAccent }: { pct: number; isAccent?: boolean }) {
    const size = 24;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedPct = Math.max(0, Math.min(1, pct));
    const strokeDashoffset = circumference - clampedPct * circumference;

    const bgStroke = isAccent ? "rgba(255, 255, 255, 0.3)" : colors.borderMedium;
    const fgStroke = isAccent ? "#FFFFFF" : colors.primary;

    return (
        <Svg width={size} height={size}>
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={bgStroke}
                strokeWidth={strokeWidth}
                fill="none"
            />
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={fgStroke}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
        </Svg>
    );
}

function matchesSearch(text: string, query: string, isTest: boolean = false): boolean {
    const normText = text.toLowerCase().trim();
    const normQuery = query.toLowerCase().trim();

    if (normText.includes(normQuery)) return true;

    const testKeywords = ["quiz", "test", "kiểm tra", "đề", "exam"];

    if (isTest) {
        const isGeneric = testKeywords.some(k => normQuery === k);
        if (isGeneric) return true;
    }

    const queryHasTestKey = testKeywords.some(k => normQuery.includes(k) && (k !== "đề" || !normQuery.includes("chủ đề")));

    if (isTest && queryHasTestKey) {
        let cleanQuery = normQuery;
        let cleanText = normText;
        testKeywords.forEach(k => {
            cleanQuery = cleanQuery.replace(k, "").trim();
            cleanText = cleanText.replace(k, "").trim();
        });

        cleanQuery = cleanQuery.replace("chủ đề", "").trim();
        cleanText = cleanText.replace("chủ đề", "").trim();

        if (cleanQuery && (cleanText.includes(cleanQuery) || cleanQuery.includes(cleanText))) {
            return true;
        }
    }

    return false;
}

function matchesTopicOrLesson(name: string, position: number, prefix: string, query: string): boolean {
    const normQuery = query.toLowerCase().trim();
    const normName = name.toLowerCase().trim();
    const prefixWithPos = `${prefix} ${position}`.toLowerCase();
    const fullName = `${prefixWithPos}: ${normName}`;

    if (fullName.includes(normQuery) || normName.includes(normQuery)) return true;

    if (/^\d+$/.test(normQuery) && parseInt(normQuery, 10) === position) {
        return true;
    }

    return false;
}

function TopicMasteryItem({ topic }: { topic: any }) {
    const [expanded, setExpanded] = useState(false);
    const pct = topic.masteryPercentage ?? 0;
    return (
        <View style={styles.masteryItemWrapper}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.masteryItemHeader} activeOpacity={0.7}>
                <Ionicons name={expanded ? "chevron-down" : "chevron-forward"} size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.masteryItemText} numberOfLines={2}>
                    Chủ đề {topic.position}: {topic.name}
                </Text>
                <Text style={styles.masteryItemPct}>{pct}%</Text>
            </TouchableOpacity>
            {expanded && <LessonMasteryList topicId={topic.id} />}
        </View>
    );
}

function LessonMasteryList({ topicId }: { topicId: number }) {
    const { data, isLoading } = useGetLessonsByTopicQuery(topicId);
    if (isLoading) return <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />;
    if (!data?.lessons || data.lessons.length === 0) return null;
    return (
        <View style={styles.masterySubList}>
            {data.lessons.map((lesson) => (
                <LessonMasteryItem key={lesson.id} lesson={lesson} />
            ))}
        </View>
    );
}

function LessonMasteryItem({ lesson }: { lesson: any }) {
    const [expanded, setExpanded] = useState(false);
    const pct = lesson.masteryPercentage ?? 0;
    return (
        <View style={styles.masteryItemWrapper}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={[styles.masteryItemHeader, { paddingLeft: 12 }]} activeOpacity={0.7}>
                <Ionicons name={expanded ? "chevron-down" : "chevron-forward"} size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.masteryItemText, { fontSize: 13, fontFamily: typography.fonts.semiBold }]} numberOfLines={2}>
                    Bài {lesson.position}: {lesson.name}
                </Text>
                <Text style={[styles.masteryItemPct, { fontSize: 13 }]}>{pct}%</Text>
            </TouchableOpacity>
            {expanded && <SectionMasteryList lessonId={lesson.id} />}
        </View>
    );
}

function SectionMasteryList({ lessonId }: { lessonId: number }) {
    const { data, isLoading } = useGetSectionsByLessonQuery(lessonId);
    if (isLoading) return <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />;
    if (!data?.sections || data.sections.length === 0) return null;
    return (
        <View style={styles.masterySubList}>
            {data.sections.map((section) => (
                <SectionMasteryItem key={section.id} section={section} />
            ))}
        </View>
    );
}

function SectionMasteryItem({ section }: { section: any }) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = (section.children && section.children.length > 0) || (section.nodes && section.nodes.length > 0);
    const pct = section.masteryPercentage ?? 0;
    return (
        <View style={styles.masteryItemWrapper}>
            <TouchableOpacity
                onPress={() => hasChildren && setExpanded(!expanded)}
                style={[styles.masteryItemHeader, { paddingLeft: 24 }]}
                activeOpacity={0.7}
                disabled={!hasChildren}
            >
                {hasChildren ? (
                    <Ionicons name={expanded ? "chevron-down" : "chevron-forward"} size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                ) : (
                    <View style={{ width: 16 }} />
                )}
                <Text style={[styles.masteryItemText, { fontSize: 12, fontFamily: typography.fonts.regular }]} numberOfLines={2}>
                    Mục: {section.name}
                </Text>
                <Text style={[styles.masteryItemPct, { fontSize: 12 }]}>{pct}%</Text>
            </TouchableOpacity>
            {expanded && (
                <View style={styles.masterySubList}>
                    {section.children?.map((child: any) => (
                        <SectionMasteryItem key={child.id} section={child} />
                    ))}
                    {section.nodes?.map((node: any) => (
                        <NodeMasteryItem key={node.id} node={node} />
                    ))}
                </View>
            )}
        </View>
    );
}

function NodeMasteryItem({ node }: { node: any }) {
    const pct = node.masteryPercentage ?? 0;
    return (
        <View style={[styles.masteryItemHeader, { paddingLeft: 36 }]}>
            <Ionicons name="document-text-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.masteryItemText, { fontSize: 12, fontFamily: typography.fonts.regular, color: colors.textSecondary }]} numberOfLines={2}>
                Nội dung: {node.header || "Nội dung học"}
            </Text>
            <Text style={[styles.masteryItemPct, { fontSize: 12, color: colors.textSecondary }]}>{pct}%</Text>
        </View>
    );
}

export function LessonMenu({
    selectedGrade,
    onLessonPress,
    onMindmapPress,
    onTestPress,
    onPracticePress,
}: LessonMenuProps) {
    const router = useRouter();
    const profile = useAppSelector((state) => state.auth.profile);
    const isUserPro = profile?.isPro === true;
    const isLoggedIn = !!profile;

    const { data: gradesData } = useGetGradesQuery();
    const [premiumModalVisible, setPremiumModalVisible] = useState(false);
    const [lockedFeatureName, setLockedFeatureName] = useState("");
    const [guestModalVisible, setGuestModalVisible] = useState(false);

    const isGradePro = React.useMemo(() => {
        const gradeObj = gradesData?.grades?.find((g) => g.id === selectedGrade);
        return !!gradeObj?.isPro;
    }, [gradesData, selectedGrade]);

    const showProModal = (feature: string) => {
        if (!profile) {
            setGuestModalVisible(true);
            return;
        }
        setLockedFeatureName(feature);
        setPremiumModalVisible(true);
    };

    const {
        topics,
        finalTestPassed,
        gradeProgress,
        loading,
        refetch,
        isFetching,
        wrongQuestionCount,
        answeredQuestionCount,
    } = useLessonMenu(selectedGrade);

    const [isMasteryExpanded, setIsMasteryExpanded] = useState(false);
    const { data: topicsMasteryData, isLoading: loadingMastery } = useGetTopicsByGradeQuery(selectedGrade, { skip: !isMasteryExpanded });

    const gradeMasteryPct = React.useMemo(() => {
        const gradeObj = gradesData?.grades?.find((g) => g.id === selectedGrade);
        return gradeObj?.masteryPercentage ?? 0;
    }, [gradesData, selectedGrade]);

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [collapsedTopics, setCollapsedTopics] = useState<Record<number, boolean>>({});
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);


    const TABS = [
        { key: "HOC_PHAN", label: "Học phần" },
        { key: "LUYEN_TAP", label: "Luyện tập" }
    ];
    const [activeTab, setActiveTab] = useState("HOC_PHAN");

    const toggleTopic = (topicId: number) => {
        setCollapsedTopics((prev) => ({
            ...prev,
            [topicId]: !prev[topicId],
        }));
    };

    const filteredTopics = React.useMemo(() => {
        if (!searchQuery.trim()) return topics;
        const query = searchQuery.trim();
        return topics
            .map((topic) => {
                const topicMatches = matchesTopicOrLesson(topic.name, topic.position, "chủ đề", query);

                const matchedLessons = topic.lessons.filter((lesson) =>
                    matchesTopicOrLesson(lesson.name, lesson.position, "bài", query)
                );

                const testTitle = `Kiểm tra Chủ đề ${topic.position}`;
                const firstTestMatches = matchesSearch(testTitle, query, true);

                if (topicMatches || matchedLessons.length > 0 || firstTestMatches) {
                    return {
                        ...topic,
                        lessons: matchedLessons.length > 0 ? matchedLessons : (topicMatches ? topic.lessons : []),
                    };
                }
                return null;
            })
            .filter(Boolean) as typeof topics;
    }, [topics, searchQuery]);

    const shouldShowFinalTest = React.useMemo(() => {
        if (!searchQuery.trim()) return true;
        const finalTestTitle = `Kiểm tra Lớp ${selectedGrade}`;
        return matchesSearch(finalTestTitle, searchQuery, true);
    }, [selectedGrade, searchQuery]);

    const overallStats = React.useMemo(() => {
        if (gradeProgress) {
            return {
                completed: gradeProgress.completedNodes,
                total: gradeProgress.totalNodes,
            };
        }
        let total = 0;
        let completed = 0;
        topics.forEach((topic) => {
            topic.lessons.forEach((lesson) => {
                const lessonAny = lesson as any;
                if (lessonAny.progress) {
                    total += lessonAny.progress.totalNodes || 0;
                    completed += lessonAny.progress.completedNodes || 0;
                }
            });
        });
        return { completed, total };
    }, [topics, gradeProgress]);

    const overallProgress = overallStats.total > 0 ? overallStats.completed / overallStats.total : 0;
    const progressPercentage = Math.round(overallProgress * 100);

    const themeColor = React.useMemo(() => {
        if (selectedGrade === 11) return colors.secondary;
        if (selectedGrade === 12) return colors.success;
        return colors.primary;
    }, [selectedGrade]);

    const branchConfig = {
        hierarchy: "Học phần",
        title: `Lớp ${selectedGrade}`,
        onBackPress: () => router.back(),
    };

    return (
        <ScreenWrapper branchConfig={branchConfig} showTopBar={false}>
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.centerLoader}>
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                        />
                    </View>
                ) : (
                    <>
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isFetching && !loading}
                                    onRefresh={refetch}
                                    colors={[colors.primary]}
                                    tintColor={colors.primary}
                                />
                            }
                        >
                            {/* Overall Grade Progress Card */}
                            <Card variant="bordered" style={styles.headerProgressCard}>
                                <View style={[styles.gradeAvatar, { backgroundColor: colors.surfaceVariant }]}>
                                    <Ionicons name="book" size={32} color={themeColor} />
                                </View>
                                <View style={styles.gradeProgressRight}>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: 8,
                                        }}
                                    >
                                        <Text style={[styles.gradeTitleText, { flex: 1, marginBottom: 0 }]}>
                                            Lớp {selectedGrade}
                                        </Text>

                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                            <TouchableOpacity
                                                onPress={() => setFeedbackModalVisible(true)}
                                                style={styles.flagButton}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name="flag-outline"
                                                    size={20}
                                                    color={colors.textSecondary}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.topProgressWrapper}>
                                        <View style={styles.topProgressTrack}>
                                            <View
                                                style={[
                                                    styles.topProgressFill,
                                                    { width: `${progressPercentage}%`, backgroundColor: themeColor },
                                                ]}
                                            >
                                                {progressPercentage >= 20 && (
                                                    <Text style={styles.progressNumberTextInside}>
                                                        {overallStats.completed}/{overallStats.total}
                                                    </Text>
                                                )}
                                            </View>
                                            {progressPercentage < 20 && (
                                                <View
                                                    style={[
                                                        styles.progressNumberTextOutsideContainer,
                                                        { left: `${progressPercentage}%` },
                                                    ]}
                                                >
                                                    <Text style={styles.progressNumberTextOutside}>
                                                        {overallStats.completed}/{overallStats.total}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View
                                            style={[
                                                styles.topProgressIconFloating,
                                                { left: `${progressPercentage}%` },
                                            ]}
                                        >
                                            <Book
                                                size={28}
                                                color={colors.borderMedium}
                                                fill="#FFFFFF"
                                                strokeWidth={1.5}
                                                style={styles.floatingBookShadow}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </Card>

                            <View style={{ marginBottom: 16 }}>
                                <SlidingTabBar
                                    tabs={TABS}
                                    activeTab={activeTab}
                                    onChangeTab={setActiveTab}
                                />
                            </View>

                            {activeTab === "HOC_PHAN" ? (
                                <>
                                    <View style={styles.searchContainer}>
                                        <TextInput
                                            style={[
                                                styles.searchInput,
                                                isSearchFocused && styles.searchInputFocused
                                            ]}
                                            placeholder="Tìm kiếm bài học..."
                                            placeholderTextColor={colors.textPlaceholder}
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            underlineColorAndroid="transparent"
                                            onFocus={() => setIsSearchFocused(true)}
                                            onBlur={() => setIsSearchFocused(false)}
                                        />
                                    </View>

                                    {filteredTopics.map((topic) => {
                                        const isCollapsed = !!collapsedTopics[topic.id];

                                        return (
                                            <View key={topic.id} style={styles.topicWrapper}>
                                                <TouchableOpacity
                                                    style={styles.topicDivider}
                                                    onPress={() => toggleTopic(topic.id)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.topicDividerText} numberOfLines={2}>
                                                        Chủ đề {topic.position}: {topic.name}
                                                    </Text>
                                                    <Ionicons
                                                        name={isCollapsed ? "chevron-down" : "chevron-up"}
                                                        size={18}
                                                        color={colors.textMuted}
                                                    />
                                                </TouchableOpacity>

                                                {!isCollapsed && (
                                                    <View style={styles.lessonList}>
                                                        {topic.lessons.map((lesson) => {
                                                            const lessonAny = lesson as any;
                                                            const lessonPct =
                                                                lessonAny.progress != null &&
                                                                    lessonAny.progress.totalNodes > 0
                                                                    ? lessonAny.progress.completedNodes /
                                                                    lessonAny.progress.totalNodes
                                                                    : 0;
                                                            const isDone = lessonPct >= 1;
                                                            const isLessonPro = !!lesson.isPro;
                                                            const isLessonLocked = (isLessonPro || isGradePro) && !isUserPro;

                                                            const handlePress = () => {
                                                                if (isLessonLocked) {
                                                                    showProModal(`bài học "${lesson.name}"`);
                                                                } else {
                                                                    onLessonPress(lesson.id);
                                                                }
                                                            };

                                                            return (
                                                                <Card
                                                                    key={lesson.id}
                                                                    variant="grayBorder"
                                                                    style={[styles.lessonCard, isLessonLocked && { opacity: 0.85 }]}
                                                                    onPress={handlePress}
                                                                >
                                                                    <View style={styles.cardTextContainer}>
                                                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                                                                            <Text style={styles.lessonCardTitle}>
                                                                                Bài {lesson.position}:{" "}
                                                                                <Text style={styles.lessonNameText}>{lesson.name}</Text>
                                                                            </Text>
                                                                            {isLessonPro && (
                                                                                <View style={[styles.proBadge, { backgroundColor: isUserPro ? colors.successContainer : colors.secondaryContainer }]}>
                                                                                    <Ionicons name={isUserPro ? "ribbon" : "lock-closed"} size={10} color={isUserPro ? colors.success : colors.secondaryHover} />
                                                                                    <Text style={[styles.proBadgeText, { color: isUserPro ? colors.success : colors.secondaryHover }]}>PRO</Text>
                                                                                </View>
                                                                            )}
                                                                        </View>
                                                                    </View>
                                                                    <View style={styles.cardRightContainer}>
                                                                        {isLessonLocked ? (
                                                                            <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                                                                        ) : isDone ? (
                                                                            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                                                                        ) : (
                                                                            <SmallProgressRing pct={lessonPct} />
                                                                        )}
                                                                        {isLoggedIn && lessonAny.progress != null && !isLessonLocked && (
                                                                            <Text style={styles.lessonProgressTextBelow}>
                                                                                {lessonAny.progress.completedNodes}/{lessonAny.progress.totalNodes}
                                                                            </Text>
                                                                        )}
                                                                    </View>
                                                                </Card>
                                                            );
                                                        })}

                                                        {(() => {
                                                            const testPassed = !!topic.testPassed;
                                                            const testIsDone = testPassed;
                                                            const isTopicTestLocked = isGradePro && !isUserPro;

                                                            const handlePress = () => {
                                                                if (isTopicTestLocked) {
                                                                    showProModal("bài kiểm tra chủ đề");
                                                                } else {
                                                                    onTestPress("TOPIC", topic.id);
                                                                }
                                                            };

                                                            return (
                                                                <Card
                                                                    variant={isTopicTestLocked ? "grayBorder" : "accent"}
                                                                    style={[styles.testCard, isTopicTestLocked && { backgroundColor: colors.surfaceVariant, borderColor: colors.borderMedium }]}
                                                                    onPress={handlePress}
                                                                >
                                                                    <Ionicons name={isTopicTestLocked ? "lock-closed" : "trophy"} size={20} color={isTopicTestLocked ? colors.textMuted : "#FFFFFF"} style={styles.cardLeftIcon} />
                                                                    <View style={styles.cardTextContainer}>
                                                                        <Text style={[styles.testCardTitle, isTopicTestLocked && { color: colors.textPrimary }]}>
                                                                            Kiểm tra Chủ đề {topic.position}
                                                                        </Text>
                                                                    </View>
                                                                    <View style={styles.cardRightContainer}>
                                                                        {isTopicTestLocked ? (
                                                                            <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                                                                        ) : testIsDone ? (
                                                                            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                                                                        ) : (
                                                                            <SmallProgressRing pct={0} isAccent={true} />
                                                                        )}
                                                                    </View>
                                                                </Card>
                                                            );
                                                        })()}
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}

                                    {shouldShowFinalTest && (() => {
                                        const finalIsDone = finalTestPassed;
                                        const isFinalTestLocked = isGradePro && !isUserPro;

                                        const handlePress = () => {
                                            if (isFinalTestLocked) {
                                                showProModal(`bài kiểm tra tổng hợp Lớp ${selectedGrade}`);
                                            } else {
                                                onTestPress("GRADE", selectedGrade);
                                            }
                                        };

                                        return (
                                            <Card
                                                variant={isFinalTestLocked ? "grayBorder" : "accent"}
                                                style={[styles.finalExamCard, isFinalTestLocked && { backgroundColor: colors.surfaceVariant, borderColor: colors.borderMedium }]}
                                                onPress={handlePress}
                                            >
                                                <Ionicons name={isFinalTestLocked ? "lock-closed" : "ribbon"} size={24} color={isFinalTestLocked ? colors.textMuted : "#FFFFFF"} style={styles.cardLeftIcon} />
                                                <View style={styles.cardTextContainer}>
                                                    <Text style={[styles.finalExamCardTitle, isFinalTestLocked && { color: colors.textPrimary }]}>
                                                        Kiểm tra tổng hợp Lớp {selectedGrade}
                                                    </Text>
                                                    <Text style={[styles.finalExamCardSubtitle, isFinalTestLocked && { color: colors.textSecondary }]}>
                                                        Đánh giá năng lực toàn diện
                                                    </Text>
                                                </View>
                                                <View style={styles.cardRightContainer}>
                                                    {isFinalTestLocked ? (
                                                        <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                                                    ) : finalIsDone ? (
                                                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                                                    ) : (
                                                        <SmallProgressRing pct={0} isAccent={true} />
                                                    )}
                                                </View>
                                            </Card>
                                        );
                                    })()}
                                </>
                            ) : !profile ? (
                                <View style={styles.guestContainer}>
                                    <Ionicons
                                        name="person-circle-outline"
                                        size={80}
                                        color={colors.primary}
                                        style={styles.guestIcon}
                                    />
                                    <Text style={styles.guestTitle}>Chế độ khách</Text>
                                    <Text style={styles.guestSubText}>
                                        Vui lòng đăng nhập hoặc đăng ký tài khoản để sử dụng tính năng luyện tập.
                                    </Text>
                                    <View style={styles.guestActions}>
                                        <Button
                                            title="Đăng nhập"
                                            variant="primary"
                                            onPress={() => router.push("/(1_auth)/1_1_login")}
                                        />
                                        <Button
                                            title="Đăng ký"
                                            variant="outline"
                                            onPress={() => router.push("/(1_auth)/1_2_register")}
                                        />
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.practiceContainer}>
                                    {/* Độ thành thạo Card (Expandable) */}
                                    <Card variant="bordered" style={[styles.practiceCard, { marginBottom: 16 }]}>
                                        <TouchableOpacity
                                            style={styles.masteryExpandHeader}
                                            onPress={() => setIsMasteryExpanded((prev) => !prev)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                                                <Ionicons name="ribbon-outline" size={24} color={themeColor} />
                                                <Text style={styles.practiceCardTitle}>Độ thành thạo</Text>
                                            </View>
                                            <Ionicons
                                                name={isMasteryExpanded ? "chevron-up" : "chevron-down"}
                                                size={20}
                                                color={colors.textSecondary}
                                            />
                                        </TouchableOpacity>

                                        {isMasteryExpanded && (
                                            <View style={{ marginTop: 16 }}>
                                                <Text style={styles.masteryExplanationText}>
                                                    Làm đúng tất cả câu hỏi 5 lần liên tiếp để đạt được 100% độ thành thạo
                                                </Text>

                                                <View style={styles.masteryGradeItem}>
                                                    <View style={styles.masteryGradeHeader}>
                                                        <Text style={styles.masteryGradeText}>Độ thành thạo Lớp {selectedGrade}</Text>
                                                        <Text style={[styles.masteryGradePct, { color: themeColor }]}>{gradeMasteryPct}%</Text>
                                                    </View>
                                                    <View style={styles.masteryProgressBarTrack}>
                                                        <View
                                                            style={[
                                                                styles.masteryProgressBarFill,
                                                                { width: `${gradeMasteryPct}%`, backgroundColor: themeColor },
                                                            ]}
                                                        />
                                                    </View>
                                                </View>

                                                <View style={styles.masteryBreakdownContainer}>
                                                    <Text style={styles.masteryBreakdownTitle}>Chi tiết theo chủ đề & bài học</Text>
                                                    {loadingMastery ? (
                                                        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
                                                    ) : topicsMasteryData?.topics && topicsMasteryData.topics.length > 0 ? (
                                                        topicsMasteryData.topics.map((topic: any) => (
                                                            <TopicMasteryItem key={topic.id} topic={topic} />
                                                        ))
                                                    ) : (
                                                        <Text style={styles.noMasteryText}>
                                                            Chưa có dữ liệu thành thạo. Hãy làm bài luyện tập để tích lũy độ thành thạo!
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        )}
                                    </Card>

                                    <PracticeSection
                                        scopeType="GRADE"
                                        scopeId={selectedGrade}
                                        wrongQuestionCount={wrongQuestionCount}
                                        answeredQuestionCount={answeredQuestionCount}
                                        onPracticePress={onPracticePress}
                                        isActiveTab={activeTab === "LUYEN_TAP"}
                                    />
                                </View>
                            )}
                        </ScrollView>
                    </>
                )}
            </View>
            {/* Context Feedback Modal */}
            <FeedbackModal
                visible={feedbackModalVisible}
                onClose={() => setFeedbackModalVisible(false)}
                targetType="GRADE"
                targetId={selectedGrade}
                targetTitle={`Khối lớp ${selectedGrade}`}
            />


            <PremiumModal
                visible={premiumModalVisible}
                onClose={() => setPremiumModalVisible(false)}
                featureName={lockedFeatureName}
            />
            <CustomModal
                visible={guestModalVisible}
                title="Yêu cầu đăng nhập"
                message="Bạn cần đăng nhập để sử dụng tính năng này. Đăng nhập ngay?"
                confirmText="Đăng nhập"
                cancelText="Hủy"
                onConfirm={() => {
                    setGuestModalVisible(false);
                    router.push("/(1_auth)/1_1_login");
                }}
                onCancel={() => setGuestModalVisible(false)}
                showMascot={true}
                mascotExpression="thinking"
            />
        </ScreenWrapper>
    );
}



const styles = StyleSheet.create({
    centerLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
    topicWrapper: { marginBottom: 24 },

    /* Topic Divider */
    topicDivider: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 12,
        paddingHorizontal: 4,
        width: "100%",
    },
    topicDividerText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textMuted,
        letterSpacing: 0.5,
        flex: 1,
        marginRight: 8,
    },

    lessonList: {
        width: "100%",
    },

    lessonCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
    },
    testCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 12,
    },
    finalExamCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginTop: 16,
        marginBottom: 24,
    },

    cardTextContainer: {
        flex: 1,
        justifyContent: "center",
    },
    cardRightContainer: {
        marginLeft: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    cardLeftIcon: {
        marginRight: 12,
    },

    lessonCardTitle: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 15,
        color: colors.textPrimary,
    },
    lessonNameText: {
        color: colors.primary,
    },
    lessonProgressTextBelow: {
        fontFamily: typography.fonts.regular,
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 4,
        textAlign: "center",
    },
    testCardTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: "#FFFFFF",
    },
    finalExamCardTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: "#FFFFFF",
    },
    finalExamCardSubtitle: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.8)",
        marginTop: 2,
    },

    searchContainer: {
        marginHorizontal: 4,
        marginTop: 4,
        marginBottom: 16,
    },
    searchInput: {
        fontFamily: typography.fonts.light,
        height: 48,
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 14,
        color: colors.textPrimary,
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    searchInputFocused: {
        borderColor: colors.accent,
    },

    /* Overall Grade Progress Card */
    headerProgressCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        marginBottom: 20,
        marginHorizontal: 4,
    },
    gradeAvatar: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    gradeProgressRight: {
        flex: 1,
        justifyContent: "center",
    },
    gradeTitleText: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.textPrimary,
    },
    gradeHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    flagButton: {
        padding: 4,
    },

    masteryBadgeButton: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 30,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    masteryBadgeButtonText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: "#FFFFFF",
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        width: "100%",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    modalTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
        marginBottom: 4,
        textAlign: "center",
    },
    practiceContainer: {
        width: "100%",
        paddingBottom: 24,
    },
    masteryExpandHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    masteryExplanationText: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 16,
        lineHeight: 18,
    },
    masteryGradeItem: {
        marginBottom: 16,
    },
    masteryGradeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    masteryGradeText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
    },
    masteryGradePct: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
    },
    masteryProgressBarTrack: {
        height: 8,
        backgroundColor: colors.borderMedium,
        borderRadius: 4,
        overflow: "hidden",
    },
    masteryProgressBarFill: {
        height: "100%",
        borderRadius: 4,
    },
    masteryBreakdownContainer: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.borderMedium,
        paddingTop: 12,
    },
    masteryBreakdownTitle: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: 8,
    },
    practiceCard: {
        padding: 20,
        marginBottom: 24,
    },
    practiceCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    practiceCardTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
        marginLeft: 8,
    },
    practiceCardDesc: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 20,
        lineHeight: 20,
    },
    practiceOptionLabel: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: 12,
    },
    practiceOptionsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    practiceOptionBtn: {
        flex: 1,
        paddingVertical: 12,
        marginHorizontal: 4,
        borderRadius: 30, // pill button border radius = 30
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        alignItems: "center",
        backgroundColor: colors.surface,
    },
    practiceOptionBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    practiceOptionText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.textSecondary,
    },
    practiceOptionTextActive: {
        color: "#FFFFFF",
    },
    practiceRewardRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    practiceRewardLabel: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
        marginRight: 12,
    },
    practiceRewardBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.accent,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    practiceRewardText: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: "#FFFFFF",
        marginLeft: 4,
    },
    practiceStartBtn: {
        backgroundColor: colors.primary,
        borderRadius: 30, // pill button border radius = 30
        paddingVertical: 14,
        alignItems: "center",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    practiceStartBtnText: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: "#FFFFFF",
    },
    modalSubtitle: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 16,
        textAlign: "center",
    },
    modalScroll: {
        maxHeight: 350,
        marginBottom: 20,
    },
    modalCloseButton: {
        borderRadius: 30,
        paddingVertical: 12,
        alignItems: "center",
    },
    modalCloseButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: "#FFFFFF",
    },
    masteryItemWrapper: {
        marginVertical: 4,
        width: "100%",
    },
    masteryItemHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingRight: 8,
    },
    masteryItemText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textPrimary,
        flex: 1,
    },
    masteryItemPct: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.accent,
        marginLeft: 8,
    },
    masterySubList: {
        borderLeftWidth: 1,
        borderLeftColor: colors.borderMedium,
        marginLeft: 8,
        paddingLeft: 4,
    },
    noMasteryText: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: "center",
        marginVertical: 20,
    },
    topProgressWrapper: {
        position: "relative",
        height: 28,
        justifyContent: "center",
    },
    topProgressTrack: {
        height: 20,
        backgroundColor: colors.borderMedium,
        borderRadius: 10,
        overflow: "hidden",
        width: "100%",
        position: "relative",
    },
    topProgressFill: {
        height: "100%",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    progressNumberTextInside: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: "#FFFFFF",
    },
    progressNumberTextOutsideContainer: {
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
        justifyContent: "center",
        alignItems: "center",
    },
    progressNumberTextOutside: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.textSecondary,
    },
    topProgressIconFloating: {
        position: "absolute",
        top: 0,
        marginLeft: -14,
    },
    floatingBookShadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 2.5,
        elevation: 3,
    },
    proBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    proBadgeText: {
        fontFamily: typography.fonts.bold,
        fontSize: 10,
    },
    guestContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    guestIcon: {
        marginBottom: 16,
    },
    guestTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 22,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    guestSubText: {
        fontFamily: typography.fonts.regular,
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    guestActions: {
        width: "100%",
        gap: 8,
    },
});