import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 1. Import useRouter của Expo Router để điều hướng
import { useRouter } from 'expo-router'; 

const { width } = Dimensions.get('window');

export default function OnboardingScreen1() {
  // 2. Khai báo router (Thay thế hoàn toàn cho prop navigation cũ)
  const router = useRouter(); 
  
  // Hàm lưu trạng thái "đã xem onboarding" vào máy
  const setOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.log('Lỗi lưu trạng thái Onboarding:', error);
    }
  };

  const handleSkip = async () => {
    console.log('Bỏ qua onboarding');
    await setOnboardingComplete(); 
    // 3. Chuyển hướng thẳng sang luồng đăng nhập auth của bạn bằng replace
    // router.replace('/(1_auth)'); 
  };

  const handleNext = () => {
    console.log('Chuyển sang màn hình tiếp theo');
    // 4. Đẩy sang màn hình 2 nằm chung thư mục nhóm
     router.push('/(routing)/screen2'); 
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Nút Bỏ qua nằm ở góc trên bên phải */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      {/* Khu vực chứa hình minh họa chính */}
      <View style={styles.imageContainer}>
        <Image
          // 5. Đường dẫn nhảy ra 2 cấp (từ app/(routing) -> app -> src -> gốc chứa assets)
          source={require('../../../assets/images/onboarding1.png')} 
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      {/* Phần bo góc màu trắng phía dưới */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Học Lịch sử thông minh</Text>
        
        <Text style={styles.description}>
          Hệ thống bài học được biên soạn theo chương trình THPT. Làm đề trắc nghiệm và theo dõi tiến trình học tập của bạn.
        </Text>

        {/* Thống kê dấu chấm */}
        <View style={styles.paginationContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Nút Tiếp tục */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Tiếp tục  ➔</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B49E7',
  },
  imageContainer: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  illustrationImage: {
    width: '100%',
    height: '90%',
    borderRadius: 16,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#5346E0',
  },
  button: {
    width: '100%',
    height: 54,
    backgroundColor: '#5346E0',
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#5346E0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});