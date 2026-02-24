import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎭 Expo로 시작하는 Show-Map</Text>
      <Text style={styles.subText}>오늘 데이터 파싱까지 끝내봅시다!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 20, fontWeight: 'bold' },
  subText: { marginTop: 10, color: '#666' }
});