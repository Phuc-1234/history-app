import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VideoErrorProps {
  onNext: () => void;
}

export default function VideoError({ onNext }: VideoErrorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Không thể phát video</Text>

      <Text style={styles.message}>
        Vui lòng kiểm tra lại kết nối mạng hoặc link video bài học.
      </Text>

      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Chuyển bài tiếp theo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: '#FCA5A5',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  message: {
    color: '#E5E7EB',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonText: {
    color: '#111827',
    fontWeight: '800',
  },
});