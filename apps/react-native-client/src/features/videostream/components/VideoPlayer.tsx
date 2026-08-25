import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";

import VideoError from "./VideoError";
import VideoLoading from "./VideoLoading";

/**
 * Wrap an toàn cho ScreenOrientation.lockAsync.
 *
 * Lý do: `expo-screen-orientation` là native module — nếu app chạy bằng Expo Go
 * hoặc build cũ chưa link native module, lời gọi sẽ throw
 * "Cannot find native module 'ExpoScreenOrientation'" và crash toàn màn video.
 * Bọc try-catch + check NativeModules để fallback êm.
 */
async function safeLockOrientation(
  lock: ScreenOrientation.OrientationLock,
): Promise<void> {
  try {
    await ScreenOrientation.lockAsync(lock);
  } catch (err) {
    console.log("[VideoPlayer] ScreenOrientation không khả dụng:", err);
  }
}

interface VideoPlayerProps {
  videoId: string;
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
  const [isUserPlaying, setIsUserPlaying] = useState(false);
  const videoViewRef = useRef<VideoView>(null);
  const navigation = useNavigation();

  const player = useVideoPlayer(videoUrl ? { uri: videoUrl } : null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.5;
  });

  useEffect(() => {
    if (!player) return;

    const subStatus = player.addListener("statusChange", ({ status, error }) => {
      if (status === "error") {
        console.log("[VideoPlayer] Video error:", error);
        setLoading(false);
        setHasError(true);
      } else if (status === "loading") {
        setLoading(true);
        setHasError(false);
      } else if (status === "readyToPlay") {
        setLoading(false);
      }
    });

    const subPlayToEnd = player.addListener("playToEnd", () => {
      onEnd();
    });

    const subTimeUpdate = player.addListener("timeUpdate", ({ currentTime }) => {
      if (onProgress && player.duration > 0) {
        onProgress(currentTime, player.duration);
      }
    });

    const subPlaying = player.addListener("playingChange", ({ isPlaying }) => {
      setIsUserPlaying(isPlaying);
      if (isPlaying) {
        setLoading(false);
      }
    });

    return () => {
      subStatus.remove();
      subPlayToEnd.remove();
      subTimeUpdate.remove();
      subPlaying.remove();
    };
  }, [player, onEnd, onProgress]);

  useEffect(() => {
    const unsubscribeBlur = navigation.addListener("blur", () => {
      try {
        player?.pause();
      } catch {}
    });
    return () => {
      unsubscribeBlur();
      try {
        player?.pause();
      } catch {}
      safeLockOrientation(ScreenOrientation.OrientationLock.DEFAULT);
    };
  }, [navigation, player]);

  const handlePlayPress = async () => {
    try {
      setIsUserPlaying(true);
      player.play();
      await safeLockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);
      await videoViewRef.current?.enterFullscreen();
    } catch (e) {
      console.log("[VideoPlayer] Play failed:", e);
    }
  };

  const handleFullscreenExit = async () => {
    await safeLockOrientation(ScreenOrientation.OrientationLock.DEFAULT);
  };

  return (
    <View style={styles.container}>
      {hasError ? (
        <VideoError onNext={onNextWhenError} />
      ) : (
        <>
          <VideoView
            ref={videoViewRef}
            key={videoId}
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={true}
            fullscreenOptions={{
              enable: true,
              orientation: "landscape",
            }}
            onFullscreenExit={handleFullscreenExit}
          />
          {!isUserPlaying && !loading && (
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
          {loading && <VideoLoading />}
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
