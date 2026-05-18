import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

export default function Input({ icon: IconComponent, isPassword, ...props }) {
  const [secureText, setSecureText] = useState(isPassword);

  return (
    <View style={styles.container}>
      {/* Icon bên trái */}
      {IconComponent && (
        <View style={styles.iconLeft}>
          <IconComponent size={18} color="#A0AEC0" />
        </View>
      )}

      {/* Ô nhập liệu */}
      <TextInput
        style={[styles.input, IconComponent && { paddingLeft: 44 }, isPassword && { paddingRight: 44 }]}
        placeholderTextColor="#A0AEC0"
        secureTextEntry={secureText}
        autoCapitalize="none"
        {...props}
      />

      {/* Nút ẩn/hiện mật khẩu nếu là trường password */}
      {isPassword && (
        <TouchableOpacity
          onPress={() => setSecureText(!secureText)}
          style={styles.iconRight}
          activeOpacity={0.7}
        >
          {secureText ? <Eye size={18} color="#A0AEC0" /> : <EyeOff size={18} color="#A0AEC0" />}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    marginVertical: 8,
  },
  input: {
    backgroundColor: '#FAF3F0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#2D3748',
  },
  iconLeft: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  iconRight: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
});