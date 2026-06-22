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
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        
        if (hasSeenOnboarding === 'true') {
          router.replace("/(tabs)/2_1_lessons");
        } else {
          router.replace('/(routing)/screen1');
        }
      } catch (error) {
        console.log('Lỗi kiểm tra Onboarding:', error);
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