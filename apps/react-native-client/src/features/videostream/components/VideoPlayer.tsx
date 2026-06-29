import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Video from "react-native-video";
import { useNavigation } from "expo-router";

import VideoError from "./VideoError";
import VideoLoading from "./VideoLoading";

interface VideoPlayerProps {
  videoId:  string;
  videoUrl: string;
  onEnd: () => void;
  onNextWhenError: () => void;
}

export default function VideoPlayer({
  videoId,
  videoUrl,
  onEnd,
  onNextWhenError,
}: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
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

  return (
    <View style={styles.container}>
      {hasError ? (
        <VideoError onNext={onNextWhenError} />
      ) : (
        <>
          <Video
            key={videoId}
            source={{
              uri: videoUrl,
              type: "m3u8",
            }}
            style={styles.video}
            controls
            resizeMode="contain"
            paused={!isFocused}
            onLoadStart={() => {
              setLoading(true);
              setHasError(false);
            }}
            onLoad={() => {
              setLoading(false);
            }}
            onBuffer={({ isBuffering }) => {
              setLoading(isBuffering);
            }}
            onEnd={onEnd}
            onError={(error) => {
              console.log("Video error:", error);
              setLoading(false);
              setHasError(true);
            }}
          />
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
});
