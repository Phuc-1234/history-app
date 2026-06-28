import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Image,
  ActivityIndicator,
  TextInput,
  ScrollView,
  RefreshControl,
} from "react-native";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { colors } from "@/theme/colors";
import { useGetNationalTestsQuery } from "@/features/test_v2/services/testApi";

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

const CARD_IMAGES = [
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150&auto=format&fit=crop&q=80",
];

export const NationalTestsView: React.FC = () => {
  const router = useRouter();
  const { data: tests, isLoading, error, refetch, isFetching } = useGetNationalTestsQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const handleTestPress = (id: string) => {
    router.push({
      pathname: "/(6_tests)/6_2_ques_choose",
      params: { testId: id, purposeType: "EXAM" },
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
        <Text style={styles.headerTitle}>Đề thi Quốc gia</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm đề thi..."
          placeholderTextColor={colors.textPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          underlineColorAndroid="transparent"
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
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => handleTestPress(item.id)}
                style={[styles.testCard, { backgroundColor: cardBgColor }]}
              >
                <Image
                  source={{ uri: CARD_IMAGES[index % CARD_IMAGES.length] }}
                  style={styles.cardImage}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.summary ? (
                    <Text style={styles.cardSummary} numberOfLines={2}>
                      {item.summary}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
    fontSize: 24,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  searchInput: {
    height: 48,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "300",
    color: colors.textPrimary,
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
    color: colors.error,
    fontSize: 14,
    fontWeight: "300",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "300",
  },
  testCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardSummary: {
    fontSize: 12,
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.8)",
  },
});