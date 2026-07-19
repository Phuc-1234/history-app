import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  ActivityIndicator,
  TextInput,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { colors } from "@/theme/colors";
import typography from "@/theme/typography";
import { Card } from "@/components/Card";
import { useGetNationalTestsQuery, useLazyGetTestInfoQuery } from "@/features/test_v2/services/testApi";
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
import { useAppSelector } from "@/store/storeHook";
import { PremiumModal } from "@/components/PremiumModal";
import { SlidingTabBar } from "@/components/SlidingTabBar";
import { PracticeSection, PracticeOptions } from "@/features/practice";
import { Ionicons } from "@expo/vector-icons";

const VIBRANT_COLORS = [
  "#E11D48", // Rose
  "#2563EB", // Blue
  "#D97706", // Amber/Gold
  "#059669", // Emerald
  "#7C3AED", // Violet
  "#0D9488", // Teal
  "#EA580C", // Orange
  "#4F46E5", // Indigo
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

export const NationalTestsView: React.FC = () => {
  const router = useRouter();
  const profile = useAppSelector((state) => state.auth.profile);
  const isUserPro = profile?.isPro === true;

  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState("");
  const [activeTab, setActiveTab] = useState<string>("DE_THI");

  const [getTestInfo] = useLazyGetTestInfoQuery();

  const showProModal = (feature: string) => {
    setLockedFeatureName(feature);
    setPremiumModalVisible(true);
  };

  const { data: tests, isLoading, error, refetch, isFetching } = useGetNationalTestsQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleTestPress = (id: string) => {
    router.push({
      pathname: "/(6_tests)/6_2_ques_choose",
      params: { testId: id, purposeType: "EXAM" },
    });
  };

  const handlePracticePress = (options: PracticeOptions) => {
    router.push({
      pathname: "/(6_tests)/6_2_ques_choose",
      params: {
        scopeType: options.scopeType,
        ...(options.scopeId != null ? { scopeId: String(options.scopeId) } : {}),
        purposeType: "PRACTICE",
        questionCount: String(options.questionCount),
        autoPickStrategy: options.autoPickStrategy,
        skipIntro: "true",
      },
    });
  };

  const filteredTests = tests?.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {activeTab === "LUYEN_TAP" ? "Luyện tập đề THPT" : "Đề thi Quốc gia"}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <SlidingTabBar
          tabs={[
            { key: "DE_THI", label: "Đề thi" },
            { key: "LUYEN_TAP", label: "Luyện tập" },
          ]}
          activeTab={activeTab}
          onChangeTab={(key: string) => setActiveTab(key)}
        />
      </View>

      {activeTab === "LUYEN_TAP" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16 }]}
        >
          <PracticeSection
            scopeType="NATIONAL"
            onPracticePress={handlePracticePress}
            isActiveTab={activeTab === "LUYEN_TAP"}
          />
        </ScrollView>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchInput,
                isSearchFocused && styles.searchInputFocused
              ]}
              placeholder="Tìm kiếm đề thi..."
              placeholderTextColor={colors.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              underlineColorAndroid="transparent"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={refetch}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Không thể tải danh sách đề thi.</Text>
          </View>
        ) : !filteredTests || filteredTests.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? "Không tìm thấy đề thi phù hợp." : "Hiện chưa có đề thi quốc gia nào."}
            </Text>
          </View>
        ) : (
          filteredTests.map((item, index) => {
            const cardBgColor = VIBRANT_COLORS[index % VIBRANT_COLORS.length];
            const IconComponent = CARD_ICONS[index % CARD_ICONS.length];
            const isTestLocked = !!item.isPro && !isUserPro;
            
            return (
              <Card
                key={item.id}
                activeOpacity={0.8}
                onPress={() => {
                  getTestInfo({ testId: item.id, purposeType: "EXAM" })
                    .unwrap()
                    .then((res) => {
                      console.log("Test info response:", res);
                    })
                    .catch((err) => {
                      console.error("Error fetching test info:", err);
                    });

                  if (isTestLocked) {
                    showProModal(`đề thi "${item.title}"`);
                  } else {
                    handleTestPress(item.id);
                  }
                }}
                style={[
                  styles.testCard,
                  {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderMedium,
                    opacity: isTestLocked ? 0.85 : 1,
                  },
                ]}
              >
                 <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant, overflow: "hidden" }]}>
                  {item.imgUrl ? (
                    <Image source={{ uri: item.imgUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <IconComponent size={28} color={cardBgColor} />
                  )}
                  {isTestLocked && (
                    <View style={styles.lockOverlay}>
                      <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <View style={styles.cardContent}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {!!item.isPro && (
                      <View style={[styles.proBadge, { backgroundColor: isUserPro ? colors.successContainer : colors.secondaryContainer }]}>
                        <Ionicons name={isUserPro ? "ribbon" : "lock-closed"} size={10} color={isUserPro ? colors.success : colors.secondaryHover} />
                        <Text style={[styles.proBadgeText, { color: isUserPro ? colors.success : colors.secondaryHover }]}>PRO</Text>
                      </View>
                    )}
                  </View>
                  {item.summary ? (
                    <Text style={styles.cardSummary} numberOfLines={2}>
                      {item.summary}
                    </Text>
                  ) : null}
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </>
  )}

  <PremiumModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        featureName={lockedFeatureName}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: "center",
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 8,
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  errorText: {
    fontFamily: typography.fonts.light,
    color: colors.error,
    fontSize: 14,
  },
  emptyText: {
    fontFamily: typography.fonts.light,
    color: colors.textSecondary,
    fontSize: 14,
  },
  testCard: {
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 16,
    color: colors.accent,
    marginBottom: 4,
  },
  cardSummary: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: "#000000",
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
});
