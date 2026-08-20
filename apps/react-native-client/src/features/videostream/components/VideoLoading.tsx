import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";

export default function VideoLoading() {
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(0.85);
  const textOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Rotation animation for the outer ring (infinite 360 rotation)
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Pulse scale animation for the center dot
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.85, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Text breathing opacity animation
    textOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const animatedDotStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  return (
    <View style={styles.overlay}>
      <View style={styles.spinnerContainer}>
        {/* Outer rotating semi-ring */}
        <Animated.View style={[styles.outerRing, animatedRingStyle]} />
        
        {/* Inner pulsing copper/gold dot */}
        <Animated.View style={[styles.innerDot, animatedDotStyle]} />
      </View>
      <Animated.Text style={[styles.text, animatedTextStyle]}>
        Đang tải bài học...
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerContainer: {
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  outerRing: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: "transparent",
    borderTopColor: colors.primary,
    borderRightColor: colors.secondary,
    opacity: 0.85,
  },
  innerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.secondary,
  },
  text: {
    color: "#FFFFFF",
    marginTop: 16,
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    letterSpacing: 0.5,
  },
});