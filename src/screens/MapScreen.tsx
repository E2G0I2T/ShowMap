import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import { fetchPerformances } from '../api/performanceApi';

// 1. 공연 데이터의 규격을 정의합니다 (Interface)
interface Performance {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  venue: string;
  poster: string;
  genre: string;
  status: string;
}

export default function MapScreen() {
  // 2. useState에 위에서 만든 타입을 연결합니다 <Performance[]>
  const [performances, setPerformances] = useState<Performance[]>([]);
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '.');

  useEffect(() => {
    fetchPerformances('20260201', '20260301').then((data) => {
      // API에서 받아온 데이터를 상태에 저장 (타입이 일치하므로 에러가 사라집니다)
      setPerformances(data);
    });
  }, []);

  const KopisFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>· 집계기간 : 최종집계 {today}</Text>
      <Text style={styles.footerText}>· 집계대상 : 모든 공연 데이터 전송기관</Text>
      <Text style={styles.footerText}>
        · 위 데이터는 공연예술통합전산망 연계기관의 티켓판매시스템에서 발권된 분량을 기준으로 제공되므로 실 관객 수와 차이가 있을 수 있습니다.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={performances}
        keyExtractor={(item) => item.id} // 이제 item이 Performance 타입임을 알아서 id를 인식합니다.
        ListFooterComponent={KopisFooter}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.poster }} style={styles.poster} />
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.subText}>{item.venue}</Text>
              <Text style={styles.subText}>{item.startDate} ~ {item.endDate}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  card: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', marginBottom: 1, elevation: 1 },
  poster: { width: 70, height: 95, borderRadius: 4 },
  info: { marginLeft: 15, justifyContent: 'center', flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  subText: { color: '#666', fontSize: 13 },
  footer: { padding: 20, backgroundColor: '#eee' },
  footerText: { fontSize: 11, color: '#888', marginBottom: 5, lineHeight: 16 }
});