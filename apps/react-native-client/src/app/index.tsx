import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Kiểm tra xem máy đã lưu cờ "đã xem onboarding" chưa
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        
        if (hasSeenOnboarding === 'true') {
          // Nếu đã xem rồi -> Đá thẳng sang màn hình Welcome của auth
           router.replace("/(1_auth)/1_1_login")
        } else {
          // Nếu là lần đầu tiên -> Đẩy vào màn hình Onboarding số 1
          router.replace('/(routing)/screen1');
        }
      } catch (error) {
        console.log('Lỗi kiểm tra Onboarding:', error);
        // Nếu lỗi, mặc định cho xem onboarding cho an toàn
        router.replace('/(routing)/screen1');
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Trong lúc đợi đọc bộ nhớ máy thì hiển thị vòng xoay tải dữ liệu nhẹ
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5346E0" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});