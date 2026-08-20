import React, { useState } from 'react';
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
import colors from '../../theme/colors';
import typography from '../../theme/typography';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Mark onboarding complete in AsyncStorage
  const setOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.log('Error saving onboarding state:', error);
    }
  };

  const handleSkip = async () => {
    await setOnboardingComplete();
    router.replace("/(tabs)/home");
  };

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      await setOnboardingComplete();
      router.replace("/(tabs)/home");
    }
  };

  const handleLogin = async () => {
    await setOnboardingComplete();
    router.replace("/(1_auth)/1_1_login");
  };

  // Render first two screens
  if (step === 0 || step === 1) {
    const isStep0 = step === 0;
    const title = isStep0 ? "Học Lịch sử thông minh" : "Học mà chơi, chơi mà học";
    const description = isStep0
      ? "Hệ thống bài học được biên soạn theo chương trình THPT. Làm đề trắc nghiệm và theo dõi tiến trình học tập của bạn."
      : "Tích lũy XP, thu thập huy hiệu, leo bảng xếp hạng với bạn bè. Ôn tập bằng thẻ lật thông minh!";
    const image = isStep0
      ? require('../../../assets/images/onboarding1.png')
      : require('../../../assets/images/onboarding2.png');

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={image}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.paginationContainer}>
            <View style={[styles.dot, isStep0 ? styles.activeDot : null]} />
            <View style={[styles.dot, !isStep0 ? styles.activeDot : null]} />
            <View style={styles.dot} />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Tiếp tục ➔</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Welcome screen (step 2)
  return (
    <LinearGradient
      colors={[colors.primaryContainer, colors.background, '#FFFFFF']}
      locations={[0, 0.6, 1]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../../assets/images/welcome_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeMainTitle}>Lịch Sử</Text>
          <Text style={styles.welcomeSubTitle}>Học và Làm đề Lịch sử</Text>
          <Text style={styles.slogan}>Chinh phục kiến thức lịch sử cùng bạn!</Text>
        </View>

        <View style={styles.bottomContent}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>Bắt đầu ngay ➔</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipText: {
    fontFamily: typography.fonts.bold,
    fontSize: 14,
    color: colors.primary,
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
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
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
    backgroundColor: colors.divider,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: colors.primary,
  },
  button: {
    width: '100%',
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: colors.textLight,
    fontFamily: typography.fonts.semiBold,
    fontSize: 16,
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
  welcomeMainTitle: {
    ...typography.h1,
    fontSize: 40,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  welcomeSubTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: 8,
  },
  slogan: {
    ...typography.bodyMedium,
    color: colors.textMuted,
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
    backgroundColor: colors.secondary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: colors.textLight,
    fontFamily: typography.fonts.bold,
    fontSize: 16,
  },
  loginTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  normalText: {
    ...typography.bodyMediumMedium,
    color: colors.textSecondary,
  },
  loginLinkText: {
    ...typography.bodyMediumBold,
    color: colors.primary,
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
    backgroundColor: colors.divider,
  },
  footerText: {
    ...typography.caption,
    fontFamily: typography.fonts.bold,
    color: colors.textMuted,
    marginHorizontal: 10,
    letterSpacing: 1.5,
  },
});
