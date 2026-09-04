import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Trophy,
  Award,
  Compass,
  History,
  School,
} from "lucide-react-native";
import { colors } from "@/theme/colors";
import typography from "@/theme/typography";
import { Card } from "@/components/Card";
import { PremiumModal } from "@/components/PremiumModal";
import { usePreventDoubleTap } from "@/hooks/usePreventDoubleTap";
import { useAppSelector } from "@/store/storeHook";
import { useGetCuratedTestsQuery } from "../services/testApi";
import { CuratedTestDto } from "../types";

const VIBRANT_COLORS = [
  "#E11D48",
  "#2563EB",
  "#D97706",
  "#059669",
  "#7C3AED",
  "#0D9488",
  "#EA580C",
  "#4F46E5",
];

const CARD_ICONS = [
  BookOpen,
  FileText,
  GraduationCap,
  Trophy,
  Award,
  Compass,
  History,
  School,
];

interface CuratedTestsSectionProps {
  scopeType: "GRADE" | "LESSON";
  scopeId: number;
  title?: string;
  themeColor?: string;
  variant?: "card" | "plain";
  defaultExpanded?: boolean;
  refreshTrigger?: number | boolean;
}

export const CuratedTestsSection: React.FC<CuratedTestsSectionProps> = ({
  scopeType,
  scopeId,
  title = "Một số đề luyện tập",
  themeColor = colors.primary,
  variant = "card",
  defaultExpanded = true,
  refreshTrigger,
}) => {
  const router = useRouter();
  const preventDoubleTap = usePreventDoubleTap();
  const profile = useAppSelector((state) => state.auth.profile);
  const isUserPro = profile?.isPro === true;

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState("");

  const { data: tests, isLoading, refetch } = useGetCuratedTestsQuery(
    { scopeType, scopeId },
    { skip: !scopeId }
  );

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger !== null) {
      refetch();
    }
  }, [refreshTrigger]);

  const handleTestPress = preventDoubleTap((test: CuratedTestDto) => {
    if (test.isPro && !isUserPro) {
      setLockedFeatureName(`đề thi "${test.title}"`);
      setPremiumModalVisible(true);
      return;
    }

    router.push({
      pathname: "/(6_tests)/6_2_ques_choose",
      params: { testId: test.id, purposeType: "EXAM" },
    });
  });

  if (isLoading || !tests || tests.length === 0) {
    return null;
  }

  const renderContent = () => (
    <View style={styles.listContainer}>
      {tests.map((item, index) => {
        const cardBgColor = VIBRANT_COLORS[index % VIBRANT_COLORS.length];
        const IconComponent = CARD_ICONS[index % CARD_ICONS.length];
        const isTestLocked = !!item.isPro && !isUserPro;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => handleTestPress(item)}
            style={[
              styles.testCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderMedium,
                opacity: isTestLocked ? 0.85 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.surfaceVariant, overflow: "hidden" },
              ]}
            >
              {item.imgUrl && item.imgUrl.trim().length > 0 ? (
                <Image
                  source={{ uri: item.imgUrl.trim() }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <IconComponent size={24} color={cardBgColor} />
              )}
              {isTestLocked && (
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>

            <View style={styles.cardContent}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {!!item.isPro && (
                  <View
                    style={[
                      styles.proBadge,
                      {
                        backgroundColor: isUserPro
                          ? colors.successContainer
                          : colors.secondaryContainer,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isUserPro ? "ribbon" : "lock-closed"}
                      size={10}
                      color={isUserPro ? colors.success : colors.secondaryHover}
                    />
                    <Text
                      style={[
                        styles.proBadgeText,
                        {
                          color: isUserPro
                            ? colors.success
                            : colors.secondaryHover,
                        },
                      ]}
                    >
                      PRO
                    </Text>
                  </View>
                )}
              </View>

              {item.summary ? (
                <Text style={styles.cardSummary} numberOfLines={2}>
                  {item.summary}
                </Text>
              ) : null}

              <View style={styles.cardStatsRow}>
                <View style={styles.cardStatItem}>
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color={colors.success}
                  />
                  <Text style={styles.cardStatText}>
                    Đã vượt qua: {item.passCount ?? 0} lần
                  </Text>
                </View>
                <View style={styles.cardStatItem}>
                  <Ionicons
                    name="ribbon-outline"
                    size={14}
                    color={themeColor}
                  />
                  <Text style={styles.cardStatText}>
                    Thành thạo: {item.masteryPercentage ?? 0}%
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <>
      {variant === "card" ? (
        <Card variant="bordered" style={[styles.cardContainer, { marginBottom: 16 }]}>
          <TouchableOpacity
            style={styles.expandHeader}
            onPress={() => setIsExpanded((prev) => !prev)}
            activeOpacity={0.7}
          >
            <View style={styles.headerLeft}>
              <Ionicons name="document-text-outline" size={24} color={themeColor} />
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {isExpanded && <View style={{ marginTop: 14 }}>{renderContent()}</View>}
        </Card>
      ) : (
        <View style={styles.plainContainer}>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.plainHeader}
            onPress={() => setIsExpanded((prev) => !prev)}
            activeOpacity={0.7}
          >
            <View style={styles.headerLeft}>
              <Ionicons name="document-text-outline" size={20} color={themeColor} />
              <Text style={styles.plainTitle}>{title}</Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {isExpanded && renderContent()}
        </View>
      )}

      <PremiumModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        featureName={lockedFeatureName}
      />
    </>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
    borderRadius: 12,
  },
  expandHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  plainContainer: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderMedium,
    marginBottom: 16,
  },
  plainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  plainTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  listContainer: {
    gap: 10,
  },
  testCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(43, 29, 18, 0.4)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
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
  cardSummary: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardStatsRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 3,
    marginTop: 4,
  },
  cardStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardStatText: {
    fontFamily: typography.fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
