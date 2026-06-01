import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function VideoLoading() {
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      <Text style={styles.text}>Đang tải bài học...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
  },
});