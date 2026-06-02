import * as React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface User {
  id: number;
  name: string;
  xp: number;
  avatar: string;
}

const topUsers: User[] = [
  {
    id: 2,
    name: "Minh Quân",
    xp: 3450,
    avatar: "https://i.pravatar.cc/100?img=12",
  },
  {
    id: 1,
    name: "Lan Anh",
    xp: 4200,
    avatar: "https://i.pravatar.cc/100?img=5",
  },
  {
    id: 3,
    name: "Hoàng Tú",
    xp: 3120,
    avatar: "https://i.pravatar.cc/100?img=15",
  },
];

const rankingList: User[] = [
  {
    id: 4,
    name: "Bảo Hân",
    xp: 2950,
    avatar: "https://i.pravatar.cc/100?img=32",
  },
  {
    id: 5,
    name: "Bạn",
    xp: 2800,
    avatar: "https://i.pravatar.cc/100?img=20",
  },
  {
    id: 6,
    name: "Tuấn Phong",
    xp: 2600,
    avatar: "https://i.pravatar.cc/100?img=18",
  },
  {
    id: 7,
    name: "Thanh Nhàn",
    xp: 2450,
    avatar: "",
  },
];

const RankingScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 390;
  const styles = React.useMemo(() => createStyles(isSmallDevice), [isSmallDevice]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.headerCard}>
        <Image
          source={{ uri: "https://i.pravatar.cc/100?img=20" }}
          style={styles.myAvatar}
        />

        <View style={styles.headerBadges}>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeText}>🎖 Đồng I</Text>
          </View>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeText}>🪙 1,250</Text>
          </View>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeText}>🔥 7</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabButton, styles.activeTabButton]}>
            <Text style={styles.activeTabText}>Hạng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton}>
            <Text style={styles.inactiveTabText}>Chuỗi</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.podiumSection}>
          <View style={styles.podiumColumn}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: topUsers[0].avatar }} style={styles.podiumAvatar} />
              <View style={[styles.rankNumberBadge, styles.rank2Badge]}>
                <Text style={styles.rankNumberText}>2</Text>
              </View>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topUsers[0].name}
            </Text>
            <Text style={styles.rank2Xp}>{topUsers[0].xp.toLocaleString()} XP</Text>
            <View style={[styles.podiumBase, styles.rank2Base]} />
          </View>

          <View style={[styles.podiumColumn, styles.centerPodiumColumn]}>
            <Text style={styles.crownIcon}>👑</Text>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: topUsers[1].avatar }}
                style={[styles.podiumAvatar, styles.rank1Avatar]}
              />
              <View style={[styles.rankNumberBadge, styles.rank1Badge]}>
                <Text style={styles.rankNumberText}>1</Text>
              </View>
            </View>
            <Text style={[styles.podiumName, styles.rank1Name]} numberOfLines={1}>
              {topUsers[1].name}
            </Text>
            <Text style={styles.rank1Xp}>{topUsers[1].xp.toLocaleString()} XP</Text>
            <View style={[styles.podiumBase, styles.rank1Base]} />
          </View>

          <View style={styles.podiumColumn}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: topUsers[2].avatar }} style={styles.podiumAvatar} />
              <View style={[styles.rankNumberBadge, styles.rank3Badge]}>
                <Text style={styles.rankNumberText}>3</Text>
              </View>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topUsers[2].name}
            </Text>
            <Text style={styles.rank3Xp}>{topUsers[2].xp.toLocaleString()} XP</Text>
            <View style={[styles.podiumBase, styles.rank3Base]} />
          </View>
        </View>

        <View style={styles.listContainer}>
          {rankingList.map((item, index) => {
            const isMe = item.name === "Bạn";
            const hasAvatar = item.avatar && item.avatar.trim() !== "";

            return (
              <View key={item.id} style={[styles.rankRow, isMe && styles.meRow]}>
                <Text style={[styles.rowPosition, isMe && styles.meText]}>{index + 4}</Text>

                {hasAvatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.rowAvatar} />
                ) : (
                  <View style={styles.rowDefaultAvatar}>
                    <Text style={styles.rowDefaultAvatarText}>
                      {item.name ? item.name.charAt(0).toUpperCase() : "?"}
                    </Text>
                  </View>
                )}

                <Text style={[styles.rowName, isMe && styles.meText]} numberOfLines={1}>
                  {item.name}
                </Text>

                <Text style={[styles.rowXp, isMe && styles.meText]}>
                  {item.xp.toLocaleString()} XP
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomTabWrap}>
        <View style={styles.fakeBottomTab}>
          <Text style={styles.tabIcon}>📖</Text>
          <Text style={styles.tabIcon}>📋</Text>
          <Text style={styles.tabIcon}>🗑️</Text>
          <Text style={styles.tabIcon}>🏪</Text>
          <View style={styles.activeTabIconWrapper}>
            <Text style={styles.activeTabIcon}>📊</Text>
          </View>
          <Text style={styles.tabIcon}>👤</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RankingScreen;

const createStyles = (isSmallDevice: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F3EFEA",
    },
    headerCard: {
      backgroundColor: "#5641E8",
      paddingHorizontal: isSmallDevice ? 14 : 16,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    myAvatar: {
      width: isSmallDevice ? 40 : 44,
      height: isSmallDevice ? 40 : 44,
      borderRadius: isSmallDevice ? 20 : 22,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      marginRight: 12,
    },
    headerBadges: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    badgeItem: {
      backgroundColor: "rgba(255,255,255,0.14)",
      borderRadius: 16,
      paddingHorizontal: isSmallDevice ? 10 : 12,
      paddingVertical: 7,
      marginLeft: 8,
      minWidth: isSmallDevice ? 74 : 82,
      alignItems: "center",
    },
    badgeText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: isSmallDevice ? 12 : 13,
    },
    scrollContent: {
      paddingHorizontal: 22,
      paddingTop: 26,
      paddingBottom: 120,
    },
    tabContainer: {
      backgroundColor: "#E2DDD7",
      borderRadius: 12,
      padding: 4,
      flexDirection: "row",
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 11,
      borderRadius: 10,
    },
    activeTabButton: {
      backgroundColor: "#F5F2EF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    activeTabText: {
      fontSize: 15,
      fontWeight: "600",
      color: "#4E3FE0",
    },
    inactiveTabText: {
      fontSize: 15,
      fontWeight: "500",
      color: "#4E4A58",
    },
    podiumSection: {
      marginTop: 18,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    podiumColumn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    centerPodiumColumn: {
      marginHorizontal: 6,
    },
    crownIcon: {
      fontSize: isSmallDevice ? 20 : 22,
      marginBottom: -2,
      zIndex: 3,
    },
    avatarWrapper: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    podiumAvatar: {
      width: isSmallDevice ? 54 : 58,
      height: isSmallDevice ? 54 : 58,
      borderRadius: isSmallDevice ? 27 : 29,
      borderWidth: 2,
      borderColor: "#B7B7B7",
      backgroundColor: "#DDD",
    },
    rank1Avatar: {
      width: isSmallDevice ? 68 : 72,
      height: isSmallDevice ? 68 : 72,
      borderRadius: isSmallDevice ? 34 : 36,
      borderColor: "#F5A000",
      borderWidth: 3,
    },
    rankNumberBadge: {
      position: "absolute",
      bottom: -6,
      right: -6,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#FFFFFF",
    },
    rank1Badge: {
      backgroundColor: "#F5A000",
    },
    rank2Badge: {
      backgroundColor: "#B4B4B4",
    },
    rank3Badge: {
      backgroundColor: "#D98B35",
    },
    rankNumberText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
    podiumName: {
      marginTop: 10,
      color: "#202020",
      fontSize: isSmallDevice ? 11 : 12,
      fontWeight: "500",
      textAlign: "center",
    },
    rank1Name: {
      fontSize: isSmallDevice ? 15 : 16,
      fontWeight: "500",
      marginTop: 12,
    },
    rank1Xp: {
      fontSize: isSmallDevice ? 13 : 14,
      fontWeight: "700",
      color: "#F29B00",
      marginTop: 3,
      marginBottom: 8,
      textAlign: "center",
    },
    rank2Xp: {
      fontSize: isSmallDevice ? 11 : 12,
      fontWeight: "600",
      color: "#4E3FE0",
      marginTop: 4,
      marginBottom: 8,
      textAlign: "center",
    },
    rank3Xp: {
      fontSize: isSmallDevice ? 11 : 12,
      fontWeight: "600",
      color: "#4E3FE0",
      marginTop: 4,
      marginBottom: 8,
      textAlign: "center",
    },
    podiumBase: {
      width: "92%",
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    rank1Base: {
      height: isSmallDevice ? 96 : 102,
      backgroundColor: "#4B37DB",
    },
    rank2Base: {
      height: isSmallDevice ? 62 : 66,
      backgroundColor: "#6A58EB",
    },
    rank3Base: {
      height: isSmallDevice ? 46 : 50,
      backgroundColor: "#9183EA",
    },
    listContainer: {
      marginTop: 34,
    },
    rankRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F7F7F7",
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 14,
    },
    meRow: {
      backgroundColor: "#DCD8F6",
      borderWidth: 1,
      borderColor: "#B8ADEE",
      shadowColor: "#7F6BFF",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 2,
    },
    rowPosition: {
      width: 22,
      marginRight: 10,
      fontSize: 15,
      fontWeight: "500",
      color: "#4A4A58",
    },
    rowAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 14,
      backgroundColor: "#DDD",
    },
    rowDefaultAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 14,
      backgroundColor: "#7D56C8",
      justifyContent: "center",
      alignItems: "center",
    },
    rowDefaultAvatarText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
    rowName: {
      flex: 1,
      fontSize: isSmallDevice ? 14 : 15,
      color: "#222222",
      fontWeight: "500",
      marginRight: 8,
    },
    rowXp: {
      fontSize: isSmallDevice ? 14 : 15,
      color: "#4E3FE0",
      fontWeight: "700",
    },
    meText: {
      color: "#4E3FE0",
      fontWeight: "700",
    },
    bottomTabWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "transparent",
    },
    fakeBottomTab: {
      height: 60,
      backgroundColor: "#F8F5F1",
      borderTopWidth: 1,
      borderTopColor: "#E7E0D7",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: 10,
      shadowColor: "#6B4EFF",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 8,
    },
    tabIcon: {
      fontSize: 20,
      color: "#4F4A58",
    },
    activeTabIconWrapper: {
      backgroundColor: "#5943E8",
      minWidth: 58,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    activeTabIcon: {
      fontSize: 18,
      color: "#FFFFFF",
    },
  });
