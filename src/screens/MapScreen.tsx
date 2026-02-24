import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Image } from 'expo-image'; // 최적화된 이미지 컴포넌트
import { fetchPerformances, fetchPerformanceAddress } from '../api/performanceApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PerformanceMarker {
  mt20id: string;
  prfnm: string;
  fcltynm: string;
  latitude: number;
  longitude: number;
  poster: string; // 포스터 추가
}

export default function MapScreen() {
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<PerformanceMarker[]>([]);
  const [selectedItem, setSelectedItem] = useState<PerformanceMarker | null>(null); // 선택된 공연 상태
  const [region, setRegion] = useState({
    latitude: 37.5665,
    longitude: 126.9780,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Location.requestForegroundPermissionsAsync();

        const list = await fetchPerformances('20260225', '20260325');
        const results: PerformanceMarker[] = [];

        for (const p of list) {
          const detailAddress = await fetchPerformanceAddress(p.mt20id);
          const searchQuery = detailAddress || `${p.area} ${p.fcltynm}`;

          const geo = await Location.geocodeAsync(searchQuery);
          if (geo && geo.length > 0) {
            results.push({
              mt20id: p.mt20id,
              prfnm: p.prfnm,
              fcltynm: p.fcltynm,
              latitude: geo[0].latitude,
              longitude: geo[0].longitude,
              poster: p.poster,
            });
          }
        }
        setMarkers(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        provider={PROVIDER_GOOGLE} 
        region={region}
        onPress={() => setSelectedItem(null)} // 빈 지도 클릭 시 상세창 닫기
      >
        {markers.map((m) => (
          <Marker 
            key={m.mt20id} 
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            onPress={(e) => {
              e.stopPropagation(); // 지도 클릭 이벤트 방해 방지
              setSelectedItem(m); // 마커 클릭 시 정보 저장
            }}
          />
        ))}
      </MapView>

      {/* 하단 상세 정보 카드 (BottomSheet 역할을 하는 View) */}
      {selectedItem && (
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Image 
              source={{ uri: selectedItem.poster }} 
              style={styles.poster}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>{selectedItem.prfnm}</Text>
              <Text style={styles.venue}>{selectedItem.fcltynm}</Text>
              
              <TouchableOpacity style={styles.button} onPress={() => alert('상세보기 준비 중')}>
                <Text style={styles.buttonText}>공연 정보 상세보기</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
              <Text style={{ fontSize: 20, color: '#999' }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>공연 정보를 가져오는 중...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  // 카드 컨테이너
  cardContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    width: '100%',
    // 그림자 설정 (iOS/Android)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  poster: {
    width: 90,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 22,
  },
  venue: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 12,
    padding: 4,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 10, fontSize: 16, fontWeight: '600' }
});