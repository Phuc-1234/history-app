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
import { useRouter } from 'expo-router'; 

const { width } = Dimensions.get('window');

export default function OnboardingScreen2() {
  const router = useRouter(); 
  
  // Hàm ghi nhận trạng thái đã xem qua toàn bộ onboarding khi người dùng bấm bỏ qua
  const setOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.log('Lỗi lưu trạng thái Onboarding:', error);
    }
  };

  const handleSkip = async () => {
    console.log('Bỏ qua onboarding ở màn 2');
    await setOnboardingComplete(); 
    // router.replace('/(1_auth)'); // Chuyển thẳng tới cụm chức năng đăng nhập
  };

  const handleNext = () => {
    console.log('Chuyển sang màn hình onboarding 3');
    // Khi bấm tiếp tục, hệ thống sẽ đẩy sang màn hình 3. 
    // Sau khi tạo xong file screen3.tsx trong cùng thư mục (routing), lệnh này sẽ tự động liên kết mượt mà.
    router.push('/(routing)/welcome'); 
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Nút Bỏ qua ở góc trên bên phải */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      {/* Khu vực chứa hình minh họa nhà thám hiểm game hóa */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/images/onboarding2.png')} 
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      {/* Khung màu trắng chứa thông tin text và nút thao tác */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Học mà chơi, chơi mà học</Text>
        
        <Text style={styles.description}>
          Tích lũy XP, thu thập huy hiệu, leo bảng xếp hạng và thách đấu 1v1 với bạn bè. Ôn tập bằng thẻ lật thông minh!
        </Text>

        {/* Cụm dấu chấm chuyển trang: Chấm số 2 chuyển thành thanh dài màu tím chủ đạo */}
        <View style={styles.paginationContainer}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
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
   flex: 1.4,               
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',           
    paddingHorizontal: 0,    
    marginTop: 10,
  },
  illustrationImage: {
    width: '90%',
    height: '100%',
    // borderRadius: 16,
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
    backgroundColor: '#5346E0', // Màu xanh tím đồng bộ với nút bấm theo thiết kế UI của bạn
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