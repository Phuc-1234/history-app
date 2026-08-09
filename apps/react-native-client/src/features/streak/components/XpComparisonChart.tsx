import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Dimensions,
} from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText, Rect } from "react-native-svg";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { useGetXpComparisonQuery, XpPoint } from "../../social/services/socialApi";

interface XpComparisonChartProps {
    targetUserId: string;
    targetUserName: string;
}

type RangeOption = "3day" | "week" | "month" | "year" | "all";

const RANGES: { key: RangeOption; label: string }[] = [
    { key: "3day", label: "3 ngày" },
    { key: "week", label: "Tuần" },
    { key: "month", label: "Tháng" },
    { key: "year", label: "Năm" },
    { key: "all", label: "Tất cả" },
];

const CHART_WIDTH = Dimensions.get("window").width - 56;
const CHART_HEIGHT = 180;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 30;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 20;

function buildPath(data: XpPoint[], maxXp: number, width: number, height: number): string {
    if (!data || data.length === 0) return "";
    const usableWidth = width - PADDING_LEFT - PADDING_RIGHT;
    const usableHeight = height - PADDING_TOP - PADDING_BOTTOM;

    const points = data.map((item, idx) => {
        const x = PADDING_LEFT + (data.length > 1 ? (idx / (data.length - 1)) * usableWidth : usableWidth / 2);
        const y = PADDING_TOP + usableHeight - (maxXp > 0 ? (item.xp / maxXp) * usableHeight : 0);
        return { x, y };
    });

    return points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
}

function formatPointDate(dateStr: string, range: RangeOption): string {
    if (!dateStr) return "";
    if (range === "year" && dateStr.startsWith("T")) {
        const parts = dateStr.slice(1).split("/");
        if (parts.length === 2) {
            const monthNum = parseInt(parts[0], 10);
            const yearNum = 2000 + parseInt(parts[1], 10);
            return `tháng ${monthNum}/${yearNum}`;
        }
    }
    return dateStr;
}

export function XpComparisonChart({ targetUserId, targetUserName }: XpComparisonChartProps) {
    const [range, setRange] = useState<RangeOption>("week");
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

    const { data, isLoading, isError } = useGetXpComparisonQuery({
        userId: targetUserId,
        range,
    });

    const myData = data?.myXpData ?? [];
    const targetData = data?.targetXpData ?? [];

    const allValues = [...myData.map((d) => d.xp), ...targetData.map((d) => d.xp)];
    const rawMax = Math.max(...allValues, 10);
    // Round max up for nice grid numbers
    const maxXp = Math.ceil(rawMax / 10) * 10;

    const usableWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
    const usableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const myPath = buildPath(myData, maxXp, CHART_WIDTH, CHART_HEIGHT);
    const targetPath = buildPath(targetData, maxXp, CHART_WIDTH, CHART_HEIGHT);

    const handleRangeChange = (r: RangeOption) => {
        setRange(r);
        setSelectedPointIndex(null);
    };

    return (
        <TouchableWithoutFeedback onPress={() => setSelectedPointIndex(null)}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>So sánh XP nhận được</Text>
                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: "#98A2B3" }]} />
                            <Text style={styles.legendText}>Tôi</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: "#FF9500" }]} />
                            <Text style={styles.legendText}>{targetUserName}</Text>
                        </View>
                    </View>
                </View>

                {/* Range Selectors */}
                <View style={styles.rangeBar}>
                    {RANGES.map((r) => {
                        const isActive = range === r.key;
                        return (
                            <TouchableOpacity
                                key={r.key}
                                style={[styles.rangePill, isActive && styles.rangePillActive]}
                                onPress={() => handleRangeChange(r.key)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.rangeText, isActive && styles.rangeTextActive]}>
                                    {r.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Chart Canvas */}
                {isLoading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                ) : isError ? (
                    <View style={styles.loadingBox}>
                        <Text style={styles.errorText}>Không thể tải dữ liệu so sánh.</Text>
                    </View>
                ) : (
                    <View style={styles.chartWrapper}>
                        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                            {/* Horizontal Grid Lines & Y-Labels */}
                            {[0, 0.5, 1].map((ratio) => {
                                const y = PADDING_TOP + usableHeight * (1 - ratio);
                                const val = Math.round(maxXp * ratio);
                                return (
                                    <React.Fragment key={`grid-${ratio}`}>
                                        <Line
                                            x1={PADDING_LEFT}
                                            y1={y}
                                            x2={CHART_WIDTH - PADDING_RIGHT}
                                            y2={y}
                                            stroke="#E4E7EC"
                                            strokeDasharray="4,4"
                                            strokeWidth={1}
                                        />
                                        <SvgText
                                            x={PADDING_LEFT - 8}
                                            y={y + 4}
                                            fill={colors.textMuted}
                                            fontSize={10}
                                            textAnchor="end"
                                        >
                                            {val}
                                        </SvgText>
                                    </React.Fragment>
                                );
                            })}

                            {/* Guideline for Selected Node */}
                            {selectedPointIndex !== null && myData[selectedPointIndex] ? (() => {
                                const total = myData.length;
                                const x = PADDING_LEFT + (total > 1 ? (selectedPointIndex / (total - 1)) * usableWidth : usableWidth / 2);
                                return (
                                    <Line
                                        x1={x}
                                        y1={PADDING_TOP}
                                        x2={x}
                                        y2={PADDING_TOP + usableHeight}
                                        stroke="#CBD5E1"
                                        strokeDasharray="2,2"
                                        strokeWidth={1.5}
                                    />
                                );
                            })() : null}

                            {/* Friend Line (Target User) */}
                            {targetPath ? (
                                <Path
                                    d={targetPath}
                                    fill="none"
                                    stroke="#FF9500"
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            ) : null}

                            {/* My Line (Faint Gray) */}
                            {myPath ? (
                                <Path
                                    d={myPath}
                                    fill="none"
                                    stroke="#98A2B3"
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            ) : null}

                            {/* Data Points for My Line */}
                            {myData.map((item, idx) => {
                                const x = PADDING_LEFT + (myData.length > 1 ? (idx / (myData.length - 1)) * usableWidth : usableWidth / 2);
                                const y = PADDING_TOP + usableHeight - (maxXp > 0 ? (item.xp / maxXp) * usableHeight : 0);
                                const isSelected = selectedPointIndex === idx;
                                return (
                                    <Circle
                                        key={`my-pt-${idx}`}
                                        cx={x}
                                        cy={y}
                                        r={isSelected ? 5 : 3}
                                        fill="#98A2B3"
                                        stroke={isSelected ? "#FFFFFF" : undefined}
                                        strokeWidth={isSelected ? 1.5 : 0}
                                    />
                                );
                            })}

                            {/* Data Points for Target Line */}
                            {targetData.map((item, idx) => {
                                const x = PADDING_LEFT + (targetData.length > 1 ? (idx / (targetData.length - 1)) * usableWidth : usableWidth / 2);
                                const y = PADDING_TOP + usableHeight - (maxXp > 0 ? (item.xp / maxXp) * usableHeight : 0);
                                const isSelected = selectedPointIndex === idx;
                                return (
                                    <Circle
                                        key={`tgt-pt-${idx}`}
                                        cx={x}
                                        cy={y}
                                        r={isSelected ? 5 : 3}
                                        fill="#FF9500"
                                        stroke={isSelected ? "#FFFFFF" : undefined}
                                        strokeWidth={isSelected ? 1.5 : 0}
                                    />
                                );
                            })}

                            {/* Hit Areas per Column for Touch Selection */}
                            {myData.map((_, idx) => {
                                const total = myData.length;
                                const colWidth = Math.max(20, usableWidth / Math.max(1, total));
                                const x = PADDING_LEFT + (total > 1 ? (idx / (total - 1)) * usableWidth : usableWidth / 2);
                                return (
                                    <Rect
                                        key={`hit-col-${idx}`}
                                        x={x - colWidth / 2}
                                        y={PADDING_TOP}
                                        width={colWidth}
                                        height={usableHeight}
                                        fill="transparent"
                                        onPress={() => setSelectedPointIndex(idx)}
                                    />
                                );
                            })}

                            {/* X-Axis Date Labels (Sampled for clean display) */}
                            {myData.map((item, idx) => {
                                const total = myData.length;
                                if (range === "year") {
                                    if ((total - 1 - idx) % 2 !== 0) return null;
                                } else {
                                    const step = Math.max(1, Math.floor(total / 5));
                                    if (idx !== 0 && idx !== total - 1 && idx % step !== 0) return null;
                                }
                                const x = PADDING_LEFT + (total > 1 ? (idx / (total - 1)) * usableWidth : usableWidth / 2);
                                return (
                                    <SvgText
                                        key={`lbl-${idx}`}
                                        x={x}
                                        y={CHART_HEIGHT - 6}
                                        fill={colors.textMuted}
                                        fontSize={9}
                                        textAnchor="middle"
                                    >
                                        {item.date}
                                    </SvgText>
                                );
                            })}
                        </Svg>

                        {/* Edge-Clamped Chat Bubble Tooltip */}
                        {selectedPointIndex !== null && myData[selectedPointIndex] ? (() => {
                            const idx = selectedPointIndex;
                            const total = myData.length;
                            const myItem = myData[idx];
                            const targetItem = targetData[idx];
                            const x = PADDING_LEFT + (total > 1 ? (idx / (total - 1)) * usableWidth : usableWidth / 2);
                            const myY = PADDING_TOP + usableHeight - (maxXp > 0 ? (myItem.xp / maxXp) * usableHeight : 0);
                            const targetY = PADDING_TOP + usableHeight - (maxXp > 0 ? ((targetItem?.xp || 0) / maxXp) * usableHeight : 0);
                            const minY = Math.min(myY, targetY);

                            const TOOLTIP_WIDTH = 150;
                            // Clamp tooltip left position so it never touches or exceeds card/screen edges
                            const left = Math.max(8, Math.min(CHART_WIDTH - TOOLTIP_WIDTH - 8, x - TOOLTIP_WIDTH / 2));
                            const top = minY > 75 ? minY - 76 : minY + 16;

                            return (
                                <View
                                    style={[
                                        styles.tooltipBubble,
                                        {
                                            left,
                                            top,
                                            width: TOOLTIP_WIDTH,
                                        },
                                    ]}
                                    pointerEvents="none"
                                >
                                    <Text style={styles.tooltipTime}>
                                        {formatPointDate(myItem.date, range)}
                                    </Text>
                                    <View style={styles.tooltipRow}>
                                        <View style={[styles.legendDot, { backgroundColor: "#98A2B3" }]} />
                                        <Text style={styles.tooltipLabel}>Tôi: </Text>
                                        <Text style={styles.tooltipValue}>+{myItem.xp} XP</Text>
                                    </View>
                                    <View style={styles.tooltipRow}>
                                        <View style={[styles.legendDot, { backgroundColor: "#FF9500" }]} />
                                        <Text style={styles.tooltipLabel} numberOfLines={1}>
                                            {targetUserName}:{" "}
                                        </Text>
                                        <Text style={styles.tooltipValue}>+{targetItem?.xp || 0} XP</Text>
                                    </View>
                                </View>
                            );
                        })() : null}
                    </View>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: "#F2F4F7",
    },
    cardHeader: {
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 6,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 15,
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
    },
    legendRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 11,
        fontFamily: typography.fonts.medium,
        color: colors.textSecondary,
        flexShrink: 1,
    },
    rangeBar: {
        flexDirection: "row",
        backgroundColor: "#F2F4F7",
        borderRadius: 30,
        padding: 3,
        marginBottom: 12,
    },
    rangePill: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 30,
        alignItems: "center",
    },
    rangePillActive: {
        backgroundColor: "#FFFFFF",
    },
    rangeText: {
        fontSize: 11,
        fontFamily: typography.fonts.medium,
        color: colors.textSecondary,
    },
    rangeTextActive: {
        color: colors.primary,
        fontFamily: typography.fonts.semiBold,
    },
    loadingBox: {
        height: CHART_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        fontSize: 12,
        color: colors.textMuted,
    },
    chartWrapper: {
        alignItems: "center",
        position: "relative",
    },
    tooltipBubble: {
        position: "absolute",
        backgroundColor: "#FFFFFF",
        borderColor: colors.orange,
        borderWidth: 1.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        zIndex: 10,
    },
    tooltipTime: {
        fontSize: 10,
        fontFamily: typography.fonts.bold,
        color: colors.textSecondary,
        marginBottom: 4,
        textAlign: "center",
    },
    tooltipRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 1,
    },
    tooltipLabel: {
        fontSize: 10,
        fontFamily: typography.fonts.medium,
        color: colors.textMuted,
        flexShrink: 1,
    },
    tooltipValue: {
        fontSize: 10,
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
    },
});
