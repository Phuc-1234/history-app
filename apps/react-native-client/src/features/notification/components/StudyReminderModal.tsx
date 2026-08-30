import React, { useState, useEffect, useRef } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    ActivityIndicator,
    Pressable,
    Animated,
    Easing,
} from "react-native";
import {
    AlarmClock,
    Clock,
    X,
    Plus,
    Trash2,
    Check,
} from "lucide-react-native";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";
import {
    useGetReminderSettingsQuery,
    useUpdateReminderSettingsMutation,
} from "../services/notificationApi";
import { toastService } from "@/services/toastService";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import Mascot from "@/components/Mascot";

interface StudyReminderModalProps {
    visible: boolean;
    onClose: () => void;
}

const PRESET_TIMES = ["07:00", "08:00", "12:00", "18:00", "20:00", "21:30"];
const FREQUENCY_OPTIONS = [1, 2, 3];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const ITEM_HEIGHT = 44;

export function StudyReminderModal({ visible, onClose }: StudyReminderModalProps) {
    const { data: reminderData, isLoading, isFetching } = useGetReminderSettingsQuery(undefined, {
        skip: !visible,
    });

    const [updateSettings, { isLoading: isSaving }] = useUpdateReminderSettingsMutation();

    const [isEnabled, setIsEnabled] = useState(true);
    const [times, setTimes] = useState<string[]>(["20:00"]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempHour, setTempHour] = useState("20");
    const [tempMinute, setTempMinute] = useState("00");

    const hourScrollRef = useRef<ScrollView>(null);
    const minuteScrollRef = useRef<ScrollView>(null);
    const swirveAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!visible) {
            swirveAnim.setValue(0);
            return;
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(swirveAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(swirveAnim, {
                    toValue: -1,
                    duration: 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(swirveAnim, {
                    toValue: 0,
                    duration: 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();
        return () => animation.stop();
    }, [visible]);

    const rotate = swirveAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ["-10deg", "0deg", "10deg"],
    });

    const translateY = swirveAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [-2, 0, -2],
    });

    const translateX = swirveAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [-2, 0, 2],
    });

    // Sync state when data loads
    useEffect(() => {
        if (reminderData) {
            setIsEnabled(reminderData.isEnabled);
            setTimes(reminderData.times.length > 0 ? reminderData.times : ["20:00"]);
        }
    }, [reminderData]);

    const scrollToHour = (h: string) => {
        const idx = HOURS.indexOf(h);
        if (idx >= 0) {
            hourScrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
        }
    };

    const scrollToMinute = (m: string) => {
        const idx = MINUTES.indexOf(m);
        if (idx >= 0) {
            minuteScrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
        }
    };

    const handleHourScroll = (e: any) => {
        const y = e.nativeEvent.contentOffset.y;
        const index = Math.round(y / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(HOURS.length - 1, index));
        if (HOURS[clamped] && HOURS[clamped] !== tempHour) {
            setTempHour(HOURS[clamped]);
        }
    };

    const handleMinuteScroll = (e: any) => {
        const y = e.nativeEvent.contentOffset.y;
        const index = Math.round(y / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(MINUTES.length - 1, index));
        if (MINUTES[clamped] && MINUTES[clamped] !== tempMinute) {
            setTempMinute(MINUTES[clamped]);
        }
    };

    const handleFrequencySelect = (count: number) => {
        if (count === times.length) return;
        if (count > times.length) {
            // Add next preset time not yet in list
            const newTimes = [...times];
            for (const preset of PRESET_TIMES) {
                if (!newTimes.includes(preset) && newTimes.length < count) {
                    newTimes.push(preset);
                }
            }
            while (newTimes.length < count) {
                newTimes.push("20:00");
            }
            newTimes.sort();
            setTimes(newTimes);
        } else {
            // Trim list
            setTimes(times.slice(0, count));
        }
    };

    const handleAddTime = () => {
        if (times.length >= 5) {
            toastService.show("Tối đa 5 mốc nhắc nhở mỗi ngày", "info");
            return;
        }
        const availablePreset = PRESET_TIMES.find((p) => !times.includes(p)) || "20:00";
        const newTimes = [...times, availablePreset].sort();
        setTimes(newTimes);
    };

    const handleRemoveTime = (index: number) => {
        if (times.length <= 1) {
            toastService.show("Cần ít nhất 1 khung giờ nhắc nhở", "info");
            return;
        }
        const newTimes = times.filter((_, idx) => idx !== index);
        setTimes(newTimes);
    };

    const handleOpenTimeEditor = (index: number) => {
        const [h, m] = times[index].split(":");
        const validH = h || "20";
        const validM = m || "00";
        setTempHour(validH);
        setTempMinute(validM);
        setEditingIndex(index);

        setTimeout(() => {
            const hIdx = HOURS.indexOf(validH);
            const mIdx = MINUTES.indexOf(validM);
            if (hIdx >= 0) {
                hourScrollRef.current?.scrollTo({ y: hIdx * ITEM_HEIGHT, animated: false });
            }
            if (mIdx >= 0) {
                minuteScrollRef.current?.scrollTo({ y: mIdx * ITEM_HEIGHT, animated: false });
            }
        }, 50);
    };

    const handleSaveCustomTime = () => {
        if (editingIndex === null) return;
        const formattedHour = String(Math.min(23, Math.max(0, parseInt(tempHour, 10) || 0))).padStart(2, "0");
        const formattedMinute = String(Math.min(59, Math.max(0, parseInt(tempMinute, 10) || 0))).padStart(2, "0");
        const newTimeStr = `${formattedHour}:${formattedMinute}`;

        const newTimes = [...times];
        newTimes[editingIndex] = newTimeStr;
        newTimes.sort();
        setTimes(Array.from(new Set(newTimes)));
        setEditingIndex(null);
    };

    const handleSaveSettings = async () => {
        const prevIsEnabled = reminderData?.isEnabled ?? true;
        const prevTimes = reminderData?.times ?? ["20:00"];

        // Optimistic: update locally and close immediately
        toastService.show("Đã lưu thiết lập nhắc nhở học tập!", "success");
        onClose();

        try {
            await updateSettings({
                isEnabled,
                times,
            }).unwrap();
        } catch (error) {
            console.error("Failed to update reminder settings:", error);
            setIsEnabled(prevIsEnabled);
            setTimes(prevTimes);
            toastService.show("Không thể lưu thiết lập, đã hoàn tác.", "error");
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdropPressable} onPress={onClose} />

                <View style={styles.modalCard}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleRow}>
                            <View style={styles.mascotWrapper}>
                                <Mascot
                                    expression="thinking"
                                    width={108}
                                    height={108}
                                />
                                <Animated.View
                                    style={[
                                        styles.mascotBubble,
                                        {
                                            transform: [
                                                { translateX },
                                                { translateY },
                                                { rotate },
                                            ],
                                        },
                                    ]}
                                >
                                    <AlarmClock size={20} color={colors.primary} />
                                    <View style={styles.bubbleTail} />
                                </Animated.View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>Nhắc hẹn học tập</Text>
                                <Text style={styles.subtitle}>
                                    Tùy chỉnh lịch nhắc nhở để duy trì thói quen học
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeBtn}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <X size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollBody}
                        >
                            {/* Switch Enable/Disable */}
                            <View style={styles.toggleRow}>
                                <View style={{ flex: 1, marginRight: 12 }}>
                                    <Text style={styles.toggleLabel}>Bật thông báo nhắc hẹn</Text>
                                </View>
                                <Switch
                                    value={isEnabled}
                                    onValueChange={setIsEnabled}
                                    trackColor={{ false: colors.borderMedium, true: colors.primary }}
                                    thumbColor={colors.surface}
                                />
                            </View>

                            {isEnabled && (
                                <>
                                    {/* Frequency Selection */}
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Số lần nhắc trong ngày</Text>
                                        <View style={styles.freqRow}>
                                            {FREQUENCY_OPTIONS.map((num) => {
                                                const isSelected = times.length === num;
                                                return (
                                                    <TouchableOpacity
                                                        key={num}
                                                        style={[
                                                            styles.freqChip,
                                                            isSelected && styles.freqChipSelected,
                                                        ]}
                                                        onPress={() => handleFrequencySelect(num)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.freqText,
                                                                isSelected && styles.freqTextSelected,
                                                            ]}
                                                        >
                                                            {num} lần / ngày
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>

                                    {/* Time Slots List */}
                                    <View style={styles.section}>
                                        <View style={styles.sectionHeaderRow}>
                                            <Text style={styles.sectionTitle}>Khung giờ nhắc nhở</Text>
                                            {times.length < 5 && (
                                                <TouchableOpacity
                                                    style={styles.addTimeBtn}
                                                    onPress={handleAddTime}
                                                    activeOpacity={0.7}
                                                >
                                                    <Plus size={14} color={colors.primary} />
                                                    <Text style={styles.addTimeText}>Thêm giờ</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <View style={styles.timesContainer}>
                                            {times.map((timeStr, idx) => (
                                                <View key={`${timeStr}-${idx}`} style={styles.timeItemRow}>
                                                    <TouchableOpacity
                                                        style={styles.timeValueBox}
                                                        onPress={() => handleOpenTimeEditor(idx)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Clock size={16} color={colors.primary} />
                                                        <Text style={styles.timeValueText}>{timeStr}</Text>
                                                    </TouchableOpacity>

                                                    <View style={styles.presetQuickRow}>
                                                        {PRESET_TIMES.slice(0, 3).map((p) => (
                                                            <TouchableOpacity
                                                                key={p}
                                                                style={[
                                                                    styles.quickPresetChip,
                                                                    timeStr === p && styles.quickPresetActive,
                                                                ]}
                                                                onPress={() => {
                                                                    const newTimes = [...times];
                                                                    newTimes[idx] = p;
                                                                    setTimes(Array.from(new Set(newTimes)).sort());
                                                                }}
                                                                activeOpacity={0.7}
                                                            >
                                                                <Text
                                                                    style={[
                                                                        styles.quickPresetText,
                                                                        timeStr === p && styles.quickPresetTextActive,
                                                                    ]}
                                                                >
                                                                    {p}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>

                                                    {times.length > 1 && (
                                                        <TouchableOpacity
                                                            style={styles.removeBtn}
                                                            onPress={() => handleRemoveTime(idx)}
                                                            activeOpacity={0.7}
                                                        >
                                                            <Trash2 size={16} color={colors.error} />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.footerActions}>
                        <PrimaryButton
                            label={isSaving ? "Đang lưu..." : "Lưu thiết lập"}
                            icon="checkmark"
                            variant="primary"
                            style={styles.saveBtn}
                            onPress={isSaving ? undefined : handleSaveSettings}
                        />
                    </View>
                </View>

                {/* Sub-Modal / Picker for Editing a Time Slot */}
                {editingIndex !== null && (
                    <Modal
                        visible={true}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setEditingIndex(null)}
                    >
                        <View style={styles.subModalOverlay}>
                            <View style={styles.timePickerCard}>
                                <Text style={styles.timePickerTitle}>Chọn giờ nhắc hẹn</Text>

                                {/* Preview Badge */}
                                <View style={styles.timePreviewBadge}>
                                    <Clock size={16} color={colors.primary} />
                                    <Text style={styles.timePreviewText}>
                                        {tempHour} : {tempMinute}
                                    </Text>
                                </View>

                                {/* Two Scrollable Wheels (Hours & Minutes) */}
                                <View style={styles.wheelContainer}>
                                    {/* Hours Column (00 - 23) */}
                                    <View style={styles.wheelCol}>
                                        <Text style={styles.wheelColHeader}>Giờ</Text>
                                        <View style={styles.wheelScrollWrapper}>
                                            <View style={styles.wheelSelectionHighlight} pointerEvents="none" />
                                            <ScrollView
                                                ref={hourScrollRef}
                                                showsVerticalScrollIndicator={false}
                                                nestedScrollEnabled={true}
                                                snapToInterval={ITEM_HEIGHT}
                                                snapToAlignment="center"
                                                decelerationRate="fast"
                                                onScroll={handleHourScroll}
                                                onMomentumScrollEnd={handleHourScroll}
                                                scrollEventThrottle={16}
                                                style={styles.wheelScrollView}
                                                contentContainerStyle={styles.wheelScrollContent}
                                            >
                                                {HOURS.map((h) => {
                                                    const isSelected = h === tempHour;
                                                    return (
                                                        <TouchableOpacity
                                                            key={`h-${h}`}
                                                            style={styles.wheelItem}
                                                            onPress={() => {
                                                                setTempHour(h);
                                                                scrollToHour(h);
                                                            }}
                                                            activeOpacity={0.7}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.wheelItemText,
                                                                    isSelected && styles.wheelItemTextSelected,
                                                                ]}
                                                            >
                                                                {h}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </ScrollView>
                                        </View>
                                    </View>

                                    <Text style={styles.wheelDividerText}>:</Text>

                                    {/* Minutes Column (00 - 59) */}
                                    <View style={styles.wheelCol}>
                                        <Text style={styles.wheelColHeader}>Phút</Text>
                                        <View style={styles.wheelScrollWrapper}>
                                            <View style={styles.wheelSelectionHighlight} pointerEvents="none" />
                                            <ScrollView
                                                ref={minuteScrollRef}
                                                showsVerticalScrollIndicator={false}
                                                nestedScrollEnabled={true}
                                                snapToInterval={ITEM_HEIGHT}
                                                snapToAlignment="center"
                                                decelerationRate="fast"
                                                onScroll={handleMinuteScroll}
                                                onMomentumScrollEnd={handleMinuteScroll}
                                                scrollEventThrottle={16}
                                                style={styles.wheelScrollView}
                                                contentContainerStyle={styles.wheelScrollContent}
                                            >
                                                {MINUTES.map((m) => {
                                                    const isSelected = m === tempMinute;
                                                    return (
                                                        <TouchableOpacity
                                                            key={`m-${m}`}
                                                            style={styles.wheelItem}
                                                            onPress={() => {
                                                                setTempMinute(m);
                                                                scrollToMinute(m);
                                                            }}
                                                            activeOpacity={0.7}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.wheelItemText,
                                                                    isSelected && styles.wheelItemTextSelected,
                                                                ]}
                                                            >
                                                                {m}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </ScrollView>
                                        </View>
                                    </View>
                                </View>

                                {/* Quick Presets in Time Picker */}
                                <View style={styles.pickerPresetRow}>
                                    {PRESET_TIMES.map((p) => {
                                        const [ph, pm] = p.split(":");
                                        const isSelected = tempHour === ph && tempMinute === pm;
                                        return (
                                            <TouchableOpacity
                                                key={p}
                                                style={[
                                                    styles.pickerPresetChip,
                                                    isSelected && styles.pickerPresetChipActive,
                                                ]}
                                                onPress={() => {
                                                    setTempHour(ph);
                                                    setTempMinute(pm);
                                                    scrollToHour(ph);
                                                    scrollToMinute(pm);
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.pickerPresetText,
                                                        isSelected && styles.pickerPresetTextActive,
                                                    ]}
                                                >
                                                    {p}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <View style={styles.pickerActionRow}>
                                    <PrimaryButton
                                        label="Hủy"
                                        variant="outline"
                                        style={styles.pickerActionBtn}
                                        onPress={() => setEditingIndex(null)}
                                    />
                                    <PrimaryButton
                                        label="Xác nhận"
                                        variant="primary"
                                        style={styles.pickerActionBtn}
                                        onPress={handleSaveCustomTime}
                                    />
                                </View>
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    backdropPressable: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalCard: {
        width: "100%",
        maxHeight: "85%",
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        overflow: "hidden",
        paddingBottom: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderMedium,
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    mascotWrapper: {
        width: 108,
        height: 108,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    mascotBubble: {
        position: "absolute",
        top: -4,
        right: 0,
        backgroundColor: colors.primaryContainer,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 7,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    bubbleTail: {
        position: "absolute",
        bottom: -5,
        left: 8,
        width: 8,
        height: 8,
        backgroundColor: colors.primaryContainer,
        borderRightWidth: 1.5,
        borderBottomWidth: 1.5,
        borderColor: colors.borderMedium,
        transform: [{ rotate: "45deg" }],
    },
    title: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.textPrimary,
    },
    subtitle: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 30,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: "center",
    },
    scrollBody: {
        padding: 16,
        gap: 16,
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.surfaceVariant,
        padding: 14,
        borderRadius: 12,
    },
    toggleLabel: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
    },
    section: {
        gap: 8,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sectionTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        color: colors.textPrimary,
    },
    freqRow: {
        flexDirection: "row",
        gap: 8,
    },
    freqChip: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    freqChipSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryContainer,
    },
    freqText: {
        fontFamily: typography.fonts.medium,
        fontSize: 12,
        color: colors.textSecondary,
    },
    freqTextSelected: {
        fontFamily: typography.fonts.bold,
        color: colors.primary,
    },
    addTimeBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 30,
        backgroundColor: colors.primaryContainer,
    },
    addTimeText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: colors.primary,
    },
    timesContainer: {
        gap: 8,
    },
    timeItemRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 8,
        gap: 8,
    },
    timeValueBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.surface,
        borderRadius: 30,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    timeValueText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textPrimary,
    },
    presetQuickRow: {
        flexDirection: "row",
        flex: 1,
        gap: 4,
    },
    quickPresetChip: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 30,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    quickPresetActive: {
        backgroundColor: colors.primaryContainer,
        borderColor: colors.primary,
    },
    quickPresetText: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: colors.textSecondary,
    },
    quickPresetTextActive: {
        fontFamily: typography.fonts.bold,
        color: colors.primary,
    },
    removeBtn: {
        padding: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    footerActions: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingTop: 10,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: colors.borderMedium,
    },
    saveBtn: {
        flex: 1,
        minHeight: 40,
        borderRadius: 30,
    },
    subModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    timePickerCard: {
        width: "100%",
        maxWidth: 340,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        padding: 20,
        alignItems: "center",
        gap: 14,
    },
    timePickerTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.textPrimary,
    },
    timePreviewBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.surfaceVariant,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    timePreviewText: {
        fontFamily: typography.fonts.bold,
        fontSize: 20,
        color: colors.primary,
        letterSpacing: 1,
    },
    wheelContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginVertical: 4,
    },
    wheelCol: {
        alignItems: "center",
        gap: 6,
    },
    wheelColHeader: {
        fontFamily: typography.fonts.medium,
        fontSize: 12,
        color: colors.textMuted,
    },
    wheelScrollWrapper: {
        height: 132,
        width: 84,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        overflow: "hidden",
        position: "relative",
    },
    wheelSelectionHighlight: {
        position: "absolute",
        top: 44,
        left: 6,
        right: 6,
        height: 44,
        backgroundColor: colors.primaryContainer,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.primary,
        zIndex: 0,
    },
    wheelScrollView: {
        flex: 1,
        zIndex: 1,
    },
    wheelScrollContent: {
        paddingVertical: 44,
        alignItems: "center",
    },
    wheelItem: {
        height: 44,
        width: 68,
        alignItems: "center",
        justifyContent: "center",
    },
    wheelItemText: {
        fontFamily: typography.fonts.medium,
        fontSize: 16,
        color: colors.textMuted,
    },
    wheelItemTextSelected: {
        fontFamily: typography.fonts.bold,
        fontSize: 20,
        color: colors.primary,
    },
    wheelDividerText: {
        fontFamily: typography.fonts.bold,
        fontSize: 24,
        color: colors.textPrimary,
        marginTop: 18,
    },
    pickerPresetRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 6,
    },
    pickerPresetChip: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 30,
        backgroundColor: colors.surfaceVariant,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    pickerPresetChipActive: {
        backgroundColor: colors.primaryContainer,
        borderColor: colors.primary,
    },
    pickerPresetText: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: colors.textSecondary,
    },
    pickerPresetTextActive: {
        fontFamily: typography.fonts.bold,
        color: colors.primary,
    },
    pickerActionRow: {
        flexDirection: "row",
        gap: 10,
        width: "100%",
        marginTop: 6,
    },
    pickerActionBtn: {
        flex: 1,
        minHeight: 38,
        borderRadius: 30,
    },
});
