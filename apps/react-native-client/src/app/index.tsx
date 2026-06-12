import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const redirectByOnboardingState = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
        router.replace(
          hasSeenOnboarding === "true"
            ? "/(routing)/welcome"
            : "/(routing)/screen1"
        );
      } catch (error) {
        console.log("Failed to load onboarding state:", error);
        router.replace("/(routing)/screen1");
      }
    };

    redirectByOnboardingState();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
