import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { LessonVideo } from '../types/videoStream.type';

interface LessonVideoItemProps {
  item: LessonVideo;
  isActive: boolean;
  onPress: () => void;
}

export default function LessonVideoItem({
  item,
  isActive,
  onPress,
}: LessonVideoItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Text style={[styles.title, isActive && styles.activeTitle]}>
          {item.title}
        </Text>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {item.duration ? (
          <Text style={styles.duration}>{item.duration}</Text>
        ) : null}
      </View>

      <View style={[styles.badge, isActive && styles.activeBadge]}>
        <Text style={[styles.badgeText, isActive && styles.activeBadgeText]}>
          {isActive ? 'Đang học' : 'Phát'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeContainer: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  activeTitle: {
    color: '#92400E',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  duration: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activeBadge: {
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '800',
  },
  activeBadgeText: {
    color: '#FFFFFF',
  },
});