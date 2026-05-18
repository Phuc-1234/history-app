import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function SocialLoginButtons() {
  return (
    <View style={styles.row}>
      {/* Nút Google chuẩn 4 màu gốc */}
      <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
        <Svg width="16" height="16" viewBox="0 0 24 24">
          <Path
            fill="#EA4335"
            d="M5.266 9.765A7.077 7.077 0 0 1 5.242 8c0-.604.076-1.19.22-1.748L1.758 3.43A11.925 11.925 0 0 0 0 8c0 1.636.327 3.2.919 4.63l4.347-2.865z"
          />
          <Path
            fill="#FBBC05"
            d="M16.04 15.158A7.126 7.126 0 0 1 12 16.3c-2.427 0-4.526-1.214-5.783-3.073L1.87 16.092A11.924 11.924 0 0 0 12 24c3.418 0 6.518-1.151 8.991-3.09l-4.95-3.752z"
          />
          <Path
            fill="#34A853"
            d="M12 4.7c1.74 0 3.32.6 4.57 1.74l3.43-3.43C17.92 1.19 15.17 0 12 0 7.354 0 3.338 2.656 1.34 6.556l4.137 3.167C6.732 7.37 9.13 4.7 12 4.7z"
          />
          <Path
            fill="#4285F4"
            d="M23.49 12.275c0-.796-.073-1.62-.218-2.395H12v4.51h6.47c-.28 1.48-1.12 2.73-2.38 3.56l4.95 3.75c2.9-2.67 4.45-6.61 4.45-11.425z"
          />
        </Svg>
        <Text style={styles.btnText}>Google</Text>
      </TouchableOpacity>

      {/* Nút Facebook */}
      <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
        <Svg width="16" height="16" fill="#1877F2" viewBox="0 0 24 24">
          <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </Svg>
        <Text style={styles.btnText}>Facebook</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 100,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4A5568',
  },
});