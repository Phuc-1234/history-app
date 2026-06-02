import React, { useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";

import LessonVideoItem from "../components/LessonVideoItem";
import VideoPlayer from "../components/VideoPlayer";
import { videoStreamService } from "../service/videoStream.service";
import { LessonVideo } from "../types/videoStream.type";

export default function VideoStreamScreen() {
  const [videos, setVideos] = useState<LessonVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [screenLoading, setScreenLoading] = useState(true);

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setScreenLoading(true);

      const data = await videoStreamService.getLessonVideos();

      setVideos(data);
    } catch (error) {
      console.log("Get lesson videos error:", error);
    } finally {
      setScreenLoading(false);
    }
  };

  const handleChangeVideo = (index: number) => {
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (videos.length === 0) return;

    setCurrentIndex((prevIndex) => {
      if (prevIndex === videos.length - 1) {
        return 0;
      }

      return prevIndex + 1;
    });
  };

  if (screenLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.loadingText}>Đang tải danh sách bài học...</Text>
      </SafeAreaView>
    );
  }

  if (!currentVideo) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.emptyText}>Chưa có video bài học.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.headerTitle}>Video bài học</Text>

            <Text style={styles.currentTitle}>{currentVideo.title}</Text>

            <VideoPlayer
              videoId={currentVideo.id}
              videoUrl={currentVideo.url}
              onEnd={handleNext}
              onNextWhenError={handleNext}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Nội dung bài học</Text>

              <Text style={styles.infoDescription}>
                {currentVideo.description ||
                  "Xem video để nắm kiến thức chính của bài học này."}
              </Text>
            </View>

            <View style={styles.progressBox}>
              <Text style={styles.progressText}>
                Bài {currentIndex + 1} / {videos.length}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Danh sách bài học</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <LessonVideoItem
            item={item}
            isActive={index === currentIndex}
            onPress={() => handleChangeVideo(index)}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
  },
  currentTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  infoDescription: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  progressBox: {
    backgroundColor: "#EEF2FF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 14,
  },
  progressText: {
    fontSize: 13,
    color: "#4338CA",
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginTop: 22,
    marginBottom: 12,
  },
});
