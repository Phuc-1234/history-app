import React from 'react';
import { View, StyleSheet } from 'react-native';
// Sửa đường dẫn sang ./ chính xác theo cấu trúc folder của bạn
import LoginForm from './features/auth/components/LoginForm';

export default function Home() {
  return (
    <View style={styles.container}>
      <LoginForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});