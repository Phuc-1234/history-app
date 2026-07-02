import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import Video, { VideoRef } from "react-native-video";
import { useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import VideoError from "./VideoError";
import VideoLoading from "./VideoLoading";

interface VideoPlayerProps {
  videoId:  string;
  videoUrl: string;
  onEnd: () => void;
  onNextWhenError: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
}

export default function VideoPlayer({
  videoId,
  videoUrl,
  onEnd,
  onNextWhenError,
  onProgress,
}: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [isUserPlaying, setIsUserPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const videoRef = useRef<VideoRef>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener("focus", () => {
      setIsFocused(true);
    });
    const unsubscribeBlur = navigation.addListener("blur", () => {
      setIsFocused(false);
    });
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const handlePlayPress = () => {
    setIsUserPlaying(true);
    setIsFullscreen(true);
    videoRef.current?.presentFullscreenPlayer();
  };

  const handleFullscreenDismiss = () => {
    setIsFullscreen(false);
    setIsUserPlaying(false);
  };

  return (
    <View style={styles.container}>
      {hasError ? (
        <VideoError onNext={onNextWhenError} />
      ) : (
        <>
          <Video
            ref={videoRef}
            key={videoId}
            source={{
              uri: videoUrl,
              type: "m3u8",
            }}
            style={styles.video}
            controls={isFullscreen}
            resizeMode="contain"
            paused={!isFocused || !isUserPlaying}
            fullscreen={isFullscreen}
            fullscreenOrientation="landscape"
            onFullscreenPlayerDidDismiss={handleFullscreenDismiss}
            onLoadStart={() => {
              setLoading(true);
              setHasError(false);
            }}
            onLoad={(data) => {
              setLoading(false);
              if (data && typeof data.duration === "number") {
                setDuration(data.duration);
              }
            }}
            onBuffer={({ isBuffering }) => {
              setLoading(isBuffering);
            }}
            onProgress={(data) => {
              if (onProgress && duration !== null && typeof data.currentTime === "number") {
                onProgress(data.currentTime, duration);
              }
            }}
            onEnd={onEnd}
            onError={(error) => {
              console.log("Video error:", error);
              setLoading(false);
              setHasError(true);
            }}
          />
          {!isUserPlaying && (
            <TouchableOpacity
              style={styles.playOverlay}
              activeOpacity={0.8}
              onPress={handlePlayPress}
            >
              <View style={styles.playButtonCircle}>
                <Ionicons name="play" size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          )}
          {loading && isUserPlaying && <VideoLoading />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000000",
    borderRadius: 18,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  playButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
