import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  // Vì đây là chặng cuối Onboarding, tự động ghi cờ đánh dấu vào máy ngay khi màn hình vừa mở lên
  useEffect(() => {
    const markOnboardingAsComplete = async () => {
      try {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        console.log('Đã tự động lưu trạng thái kết thúc Onboarding tại màn Welcome');
      } catch (error) {
        console.log('Lỗi tự động lưu flag:', error);
      }
    };
    
    markOnboardingAsComplete();
  }, []);

  const handleStart = () => {
    console.log('Bấm Bắt đầu ngay');
    router.replace("/(tabs)/home");
  };

  const handleLogin = () => {
    console.log('Bấm Đăng nhập');
    router.replace("/(1_auth)/1_1_login");
  };

  return (
    <LinearGradient
      colors={['#5E4AE3', '#A394FA', '#F8F9FA', '#FFFFFF']}
      locations={[0, 0.4, 0.8, 1]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        
        {/* Khu vực trung tâm: Logo Sách Ngôi Sao và Tiêu đề */}
        <View style={styles.centerContent}>
          
          {/* Khu vực chứa Logo hình ảnh */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../../assets/images/welcome_logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.mainTitle}>Lịch Sử</Text>
          <Text style={styles.subTitle}>Học và Làm đề Lịch sử</Text>
          <Text style={styles.slogan}>Chinh phục kiến thức lịch sử cùng bạn!</Text>
        </View>

        {/* Khu vực nút bấm phía dưới */}
        <View style={styles.bottomContent}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleStart}>
            <Text style={styles.primaryButtonText}>Bắt đầu ngay  ➔</Text>
          </TouchableOpacity>

          <View style={styles.loginTextContainer}>
            <Text style={styles.normalText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLinkText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerDivider}>
            <View style={styles.line} />
            <Text style={styles.footerText}>SỬ VIỆT TOÀN THƯ</Text>
            <View style={styles.line} />
          </View>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

// STYLE ĐÃ ĐƯỢC DUỖI DỌC TOÀN BỘ RẤT GỌN GÀNG ĐÂY NÈ HỒNG:
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  logoWrapper: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  mainTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  slogan: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  bottomContent: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FF9F1C',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#FF9F1C',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  normalText: {
    fontSize: 14,
    color: '#555555',
    fontWeight: '500',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#4B49E7',
    fontWeight: '700',
  },
  footerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    opacity: 0.4,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#7F8C8D',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7F8C8D',
    marginHorizontal: 10,
    letterSpacing: 1.5,
  },
});