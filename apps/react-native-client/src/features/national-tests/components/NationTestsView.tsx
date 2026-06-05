import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
} from "react-native";

// Định nghĩa cấu trúc dữ liệu cho các đề thi
interface TestItem {
  id: string;
  type: 'official' | 'sample';
  year: string;
  code?: string;
  publisher?: string;
  questions: string;
  time: string;
  score?: string;
  title: string;
  status?: 'new' | 'completed';
  icon: 'book' | 'star' | 'cap';
}

const filterTabs = ["Tất cả", "Mới", "Chưa làm", "Phổ biến"];

const testData: TestItem[] = [
  {
    id: "1",
    type: "official",
    year: "2022",
    code: "301",
    questions: "40 câu",
    time: "50'",
    title: "Đề chính thức 2022",
    status: "new",
    icon: "book",
  },
  {
    id: "2",
    type: "official",
    year: "2021",
    score: "Đạt 8.5/10 điểm",
    questions: "40 câu",
    time: "50'",
    title: "Đề chính thức 2021",
    status: "completed",
    icon: "star",
  },
  {
    id: "3",
    type: "sample",
    year: "2022",
    publisher: "Bộ GD&ĐT",
    questions: "40 câu",
    time: "50'",
    title: "Đề minh họa 2022",
    icon: "cap",
  },
];

export const NationalTestsView: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState("Tất cả");

  const handleTestPress = (id: string) => {
    console.log(`Navigating to test sheet: ${id}`);
  };

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case "book": return "📖";
      case "star": return "⭐";
      case "cap": return "🎓";
      default: return "📄";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Khối Đề Thi Đang Làm (Thẻ Lớn Bên Trên) */}
        <TouchableOpacity
          style={styles.ongoingCard}
          onPress={() => handleTestPress("ongoing_2023")}
          activeOpacity={0.9}
        >
          <View style={styles.ongoingImageContainer}>
            <View style={styles.ongoingIconOverlay}>
              <Text style={styles.ongoingIconText}>📝</Text>
            </View>
          </View>
          
          <View style={styles.ongoingPlayButton}>
            <Text style={styles.playIconText}>▶️</Text>
          </View>

          <View style={styles.ongoingDetails}>
            <View style={styles.ongoingTitleBlock}>
              <View style={styles.badgeDangLam}>
                <Text style={styles.badgeTextDangLam}>Đang làm</Text>
              </View>
              <Text style={styles.ongoingTitle} numberOfLines={2}>
                Đề thi THPT Quốc gia 2023
              </Text>
            </View>
            
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Tiến độ</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: '60%' }]} />
              </View>
              <Text style={styles.progressPercent}>60%</Text>
            </View>
            <Text style={styles.questionsRemaining}>Đã hoàn thành 24/40 câu hỏi</Text>
          </View>
        </TouchableOpacity>

        {/* Ngăn Bộ Lọc (Filter Tabs) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedFilter(tab)}
              style={[
                styles.filterTab,
                selectedFilter === tab && styles.filterTabSelected,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === tab && styles.filterTabTextSelected,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Danh Sách Các Đề Thi Dạng Thẻ Ngang */}
        <View style={styles.testList}>
          {testData.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => handleTestPress(item.id)}
              style={styles.testCard}
            >
              <View style={styles.testCardLeft}>
                <View style={[
                  styles.testIconContainer, 
                  { backgroundColor: item.type === 'official' ? '#EAE6FF' : '#F3EFFE' }
                ]}>
                  <Text style={styles.testIconText}>{renderIcon(item.icon)}</Text>
                </View>
                
                <View style={styles.testDetails}>
                  <Text style={styles.testTitle}>{item.title}</Text>
                  <Text style={styles.testSubTitle}>
                    {item.code ? `Mã đề ${item.code}` : item.publisher}
                  </Text>
                  <Text style={styles.testMeta}>
                    📊 {item.questions}   ⏱️ {item.time} {item.score ? `   🔸 ${item.score}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.testCardRight}>
                {item.status === 'new' && (
                  <View style={styles.badgeMoi}>
                    <Text style={styles.badgeTextMoi}>MỚI</Text>
                  </View>
                )}
                {item.status === 'completed' && (
                  <View style={styles.badgeHoanThanh}>
                    <Text style={styles.badgeTextHoanThanh}>HOÀN THÀNH</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nút Xem Thêm */}
        <TouchableOpacity style={styles.seeMoreButton} activeOpacity={0.7}>
          <Text style={styles.seeMoreText}>Xem thêm </Text>
          <Text style={styles.seeMoreIcon}>🔽</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F5",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40, // Đã giảm bớt khoảng trống phía dưới sau khi xóa Tab Bar
  },
  ongoingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    paddingBottom: 20,
    position: 'relative',
  },
  ongoingImageContainer: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#5046E5', // Dùng màu tím nền đồng bộ thay vì load ảnh mạng bị chậm
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  ongoingIconOverlay: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 30,
  },
  ongoingIconText: {
    fontSize: 28,
  },
  ongoingPlayButton: {
    position: 'absolute',
    top: 160,
    right: 24,
    width: 40,
    height: 40,
    backgroundColor: '#5046E5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  playIconText: {
    fontSize: 14,
    marginLeft: 2,
  },
  ongoingDetails: {
    paddingHorizontal: 20,
  },
  ongoingTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeDangLam: {
    backgroundColor: '#EFEBE6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  badgeTextDangLam: {
    color: '#6E6A75',
    fontSize: 10,
    fontWeight: '600',
  },
  ongoingTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E1E1E",
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6E6A75',
    marginRight: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#EFEBE6',
    borderRadius: 3,
    marginRight: 10,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#5046E5',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5046E5',
  },
  questionsRemaining: {
    fontSize: 12,
    color: '#6E6A75',
  },
  filterContainer: {
    flexDirection: "row",
    paddingVertical: 4,
    marginBottom: 24,
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 12,
    borderColor: '#EFEBE6',
    borderWidth: 1,
  },
  filterTabSelected: {
    backgroundColor: "#5046E5",
    borderColor: '#5046E5',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6E6A75",
  },
  filterTabTextSelected: {
    color: "#FFFFFF",
  },
  testList: {
    marginBottom: 16,
  },
  testCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  testCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  testIconText: {
    fontSize: 20,
  },
  testDetails: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E1E1E",
    marginBottom: 2,
  },
  testSubTitle: {
    fontSize: 12,
    color: '#6E6A75',
    marginBottom: 4,
  },
  testMeta: {
    fontSize: 11,
    color: '#A09CA6',
  },
  testCardRight: {
    marginLeft: 8,
  },
  badgeMoi: {
    backgroundColor: '#FAF8F5',
    borderColor: '#5046E5',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeTextMoi: {
    color: '#5046E5',
    fontSize: 9,
    fontWeight: '700',
  },
  badgeHoanThanh: {
    backgroundColor: '#FAF8F5',
    borderColor: '#FF7D00',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeTextHoanThanh: {
    color: '#FF7D00',
    fontSize: 9,
    fontWeight: '700',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#EFEBE6',
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 12,
  },
  seeMoreText: {
    fontSize: 13,
    color: '#5046E5',
    fontWeight: '600',
  },
  seeMoreIcon: {
    fontSize: 9,
  },
});