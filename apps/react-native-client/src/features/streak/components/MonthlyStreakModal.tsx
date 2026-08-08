import React, { useState, useEffect, useRef } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Flame, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { useGetMonthlyStreakCalendarQuery } from "../services/streakApi";

interface MonthlyStreakModalProps {
    visible: boolean;
    onClose: () => void;
}

const WEEK_HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const YEARS = Array.from({ length: 51 }, (_, i) => 2000 + i);
const ROLLER_ITEM_HEIGHT = 44;

function getFlameStyle(xp: number) {
    if (xp <= 0) {
        return {
            bg: "#F2F4F7",
            iconColor: "#98A2B3",
            textStyle: { color: colors.textSecondary },
        };
    }
    if (xp <= 25) {
        return {
            bg: "#FFF4E5",
            iconColor: "#FF9500",
            textStyle: { color: "#D97706", fontFamily: typography.fonts.semiBold },
        };
    }
    if (xp <= 60) {
        return {
            bg: "#FFE8D6",
            iconColor: "#FF5722",
            textStyle: { color: "#EA580C", fontFamily: typography.fonts.bold },
        };
    }
    return {
        bg: "#FFD8BE",
        iconColor: "#D97706",
        textStyle: { color: "#B45309", fontFamily: typography.fonts.bold },
    };
}

function SkeletonGrid() {
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.8,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [pulseAnim]);

    return (
        <View style={styles.gridContainerFixed}>
            {Array.from({ length: 42 }).map((_, idx) => (
                <View key={`skel-${idx}`} style={styles.dayCell}>
                    <Animated.View
                        style={[
                            styles.skeletonCircle,
                            { opacity: pulseAnim },
                        ]}
                    />
                </View>
            ))}
        </View>
    );
}

export function MonthlyStreakModal({ visible, onClose }: MonthlyStreakModalProps) {
    const insets = useSafeAreaInsets();
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);

    const [monthPickerVisible, setMonthPickerVisible] = useState(false);
    const [yearPickerVisible, setYearPickerVisible] = useState(false);
    const [tempSelectedYear, setTempSelectedYear] = useState(year);
    const yearScrollViewRef = useRef<ScrollView>(null);

    const { data, isLoading } = useGetMonthlyStreakCalendarQuery(
        { year, month },
        { skip: !visible },
    );

    useEffect(() => {
        if (yearPickerVisible) {
            setTempSelectedYear(year);
            const idx = YEARS.indexOf(year);
            const timer = setTimeout(() => {
                if (idx !== -1 && yearScrollViewRef.current) {
                    yearScrollViewRef.current.scrollTo({
                        y: idx * ROLLER_ITEM_HEIGHT,
                        animated: false,
                    });
                }
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [yearPickerVisible, year]);

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear((y) => y - 1);
        } else {
            setMonth((m) => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear((y) => y + 1);
        } else {
            setMonth((m) => m + 1);
        }
    };

    // Calculate grid padding & total fixed 42 cells (6 rows x 7 cols)
    const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const startPadding = (firstDayOfMonth.getUTCDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    const dailyXpMap = new Map<number, number>();
    if (data?.dailyXp) {
        data.dailyXp.forEach((item) => {
            const dayNum = parseInt(item.date.slice(8, 10), 10);
            dailyXpMap.set(dayNum, item.xp);
        });
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.container,
                        {
                            paddingBottom: Math.max(24, insets.bottom + 16),
                            height: 520 + insets.bottom,
                        },
                    ]}
                >
                    <View style={styles.topIndicator} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Lịch chuỗi học tập</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Month & Year Field Selectors */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity
                            onPress={handlePrevMonth}
                            style={styles.navButton}
                            activeOpacity={0.7}
                        >
                            <ChevronLeft size={18} color={colors.textPrimary} />
                        </TouchableOpacity>

                        <View style={styles.selectorsRow}>
                            {/* Month Selector Pill */}
                            <TouchableOpacity
                                style={styles.selectorPill}
                                onPress={() => setMonthPickerVisible(true)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.selectorText}>Tháng {month}</Text>
                                <ChevronDown size={14} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {/* Year Selector Pill */}
                            <TouchableOpacity
                                style={styles.selectorPill}
                                onPress={() => setYearPickerVisible(true)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.selectorText}>Năm {year}</Text>
                                <ChevronDown size={14} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleNextMonth}
                            style={styles.navButton}
                            activeOpacity={0.7}
                        >
                            <ChevronRight size={18} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Fixed Height Grid Shell */}
                    <View style={styles.fixedContentArea}>
                        {/* Grid Header (T2 - CN) */}
                        <View style={styles.gridRow}>
                            {WEEK_HEADERS.map((h) => (
                                <Text key={h} style={styles.weekHeaderCell}>
                                    {h}
                                </Text>
                            ))}
                        </View>

                        {isLoading ? (
                            <SkeletonGrid />
                        ) : (
                            <View style={styles.gridContainerFixed}>
                                {Array.from({ length: 42 }).map((_, slotIdx) => {
                                    const day = slotIdx - startPadding + 1;
                                    const isValidDay = day >= 1 && day <= daysInMonth;

                                    if (!isValidDay) {
                                        return <View key={`slot-${slotIdx}`} style={styles.dayCellEmpty} />;
                                    }

                                    const xp = dailyXpMap.get(day) || 0;
                                    const flameStyle = getFlameStyle(xp);

                                    return (
                                        <View key={`slot-${slotIdx}`} style={styles.dayCell}>
                                            <View style={[styles.dayCircle, { backgroundColor: flameStyle.bg }]}>
                                                <Flame size={15} color={flameStyle.iconColor} />
                                                <Text style={[styles.dayNumber, flameStyle.textStyle]}>
                                                    {day}
                                                </Text>
                                            </View>
                                            {xp > 0 ? (
                                                <Text style={styles.xpText}>+{xp} XP</Text>
                                            ) : null}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Month Picker Sub-Modal */}
            <Modal
                transparent={true}
                visible={monthPickerVisible}
                animationType="fade"
                onRequestClose={() => setMonthPickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.pickerOverlay}
                    activeOpacity={1}
                    onPress={() => setMonthPickerVisible(false)}
                >
                    <View style={styles.pickerBox}>
                        <Text style={styles.pickerTitle}>Chọn Tháng</Text>
                        <View style={styles.pickerGrid}>
                            {MONTHS.map((m) => (
                                <TouchableOpacity
                                    key={`m-${m}`}
                                    style={[
                                        styles.pickerOption,
                                        m === month && styles.pickerOptionActive,
                                    ]}
                                    onPress={() => {
                                        setMonth(m);
                                        setMonthPickerVisible(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.pickerOptionText,
                                            m === month && styles.pickerOptionTextActive,
                                        ]}
                                    >
                                        Tháng {m}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Year Picker Sub-Modal Roller */}
            <Modal
                transparent={true}
                visible={yearPickerVisible}
                animationType="fade"
                onRequestClose={() => setYearPickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.pickerOverlay}
                    activeOpacity={1}
                    onPress={() => setYearPickerVisible(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={styles.rollerBox}>
                        <Text style={styles.pickerTitle}>Chọn Năm</Text>

                        <View style={styles.rollerWrapper}>
                            <View style={styles.rollerHighlight} />
                            <ScrollView
                                ref={yearScrollViewRef}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={ROLLER_ITEM_HEIGHT}
                                decelerationRate="fast"
                                onMomentumScrollEnd={(e) => {
                                    const idx = Math.round(
                                        e.nativeEvent.contentOffset.y / ROLLER_ITEM_HEIGHT,
                                    );
                                    const clampedIdx = Math.max(0, Math.min(YEARS.length - 1, idx));
                                    setTempSelectedYear(YEARS[clampedIdx]);
                                }}
                                contentContainerStyle={{
                                    paddingVertical: ROLLER_ITEM_HEIGHT * 2,
                                }}
                            >
                                {YEARS.map((y) => {
                                    const isSelected = y === tempSelectedYear;
                                    return (
                                        <TouchableOpacity
                                            key={`y-roller-${y}`}
                                            style={styles.rollerItem}
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                setTempSelectedYear(y);
                                                const idx = YEARS.indexOf(y);
                                                yearScrollViewRef.current?.scrollTo({
                                                    y: idx * ROLLER_ITEM_HEIGHT,
                                                    animated: true,
                                                });
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.rollerItemText,
                                                    isSelected && styles.rollerItemTextActive,
                                                ]}
                                            >
                                                Năm {y}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={() => {
                                setYear(tempSelectedYear);
                                setYearPickerVisible(false);
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmButtonText}>Xác nhận</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    container: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 24,
        height: 520, // Fixed Modal Container Height
    },
    topIndicator: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#E4E7EC",
        alignSelf: "center",
        marginTop: 8,
        marginBottom: 8,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F2F4F7",
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    monthNav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    navButton: {
        padding: 6,
        borderRadius: 30,
        backgroundColor: "#F2F4F7",
    },
    selectorsRow: {
        flexDirection: "row",
        gap: 8,
    },
    selectorPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#F2F4F7",
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    selectorText: {
        fontSize: 13,
        fontFamily: typography.fonts.semiBold,
        color: colors.textPrimary,
    },
    fixedContentArea: {
        paddingHorizontal: 16,
        height: 410, // Fixed Grid Area Height
    },
    gridRow: {
        flexDirection: "row",
        marginBottom: 8,
    },
    weekHeaderCell: {
        flex: 1,
        textAlign: "center",
        fontSize: 12,
        fontFamily: typography.fonts.semiBold,
        color: colors.textSecondary,
    },
    gridContainerFixed: {
        flexDirection: "row",
        flexWrap: "wrap",
        height: 384, // 6 rows * 64px = 384px fixed
    },
    dayCellEmpty: {
        width: "14.28%",
        height: 64,
    },
    dayCell: {
        width: "14.28%",
        height: 64,
        alignItems: "center",
        justifyContent: "center",
    },
    dayCircle: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    skeletonCircle: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#E4E7EC",
    },
    dayNumber: {
        fontSize: 10,
        marginTop: -2,
    },
    xpText: {
        fontSize: 9,
        fontFamily: typography.fonts.medium,
        color: colors.primary,
        marginTop: 1,
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    pickerBox: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        width: "85%",
    },
    pickerTitle: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
        marginBottom: 16,
        textAlign: "center",
    },
    pickerGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "center",
    },
    pickerOption: {
        width: "28%",
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: "#F2F4F7",
        alignItems: "center",
    },
    pickerOptionActive: {
        backgroundColor: colors.primary,
    },
    pickerOptionText: {
        fontSize: 13,
        fontFamily: typography.fonts.medium,
        color: colors.textPrimary,
    },
    pickerOptionTextActive: {
        color: "#FFFFFF",
        fontFamily: typography.fonts.bold,
    },
    rollerBox: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        width: "80%",
        alignItems: "center",
    },
    rollerWrapper: {
        height: 220, // 5 visible items * 44px
        width: "100%",
        position: "relative",
        overflow: "hidden",
        marginVertical: 12,
    },
    rollerHighlight: {
        position: "absolute",
        top: 88, // 2 items padding * 44px
        left: 0,
        right: 0,
        height: 44,
        backgroundColor: "#FFF4E5",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    rollerItem: {
        height: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    rollerItemText: {
        fontSize: 16,
        fontFamily: typography.fonts.medium,
        color: colors.textSecondary,
    },
    rollerItemTextActive: {
        fontSize: 18,
        fontFamily: typography.fonts.bold,
        color: colors.primary,
    },
    confirmButton: {
        marginTop: 12,
        width: "100%",
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 30,
        alignItems: "center",
    },
    confirmButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontFamily: typography.fonts.bold,
    },
});
