import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { fetchPerformanceAddress } from '../api/performanceApi';

export default function DetailScreen({ route }: any) {
  const { item } = route.params;
  const [coords, setCoords] = useState<any>(null);
  const [loadingMap, setLoadingMap] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingMap(true);
      // 1. 상세 API에서 주소 가져오기 시도
      const address = await fetchPerformanceAddress(item.mt20id);
      // 2. 주소가 없으면 공연장 이름으로 검색어 생성
      const searchQuery = address || `${item.area} ${item.fcltynm}`;
      
      const geo = await Location.geocodeAsync(searchQuery);
      if (geo.length > 0) {
        setCoords({
          latitude: geo[0].latitude,
          longitude: geo[0].longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
      setLoadingMap(false);
    })();
  }, [item.mt20id]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{item.prfnm}</Text>
      <View style={styles.infoBox}>
        <Text style={styles.info}>📍 장소: {item.fcltynm}</Text>
        <Text style={styles.info}>📅 기간: {item.prfpdfrom} ~ {item.prfpdto}</Text>
        <Text style={styles.info}>🎭 장르: {item.genrenm}</Text>
      </View>
      
      <View style={styles.mapContainer}>
        {loadingMap ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : coords ? (
          <MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={coords}>
            <Marker coordinate={coords} title={item.fcltynm} />
          </MapView>
        ) : (
          <Text>공연장 위치를 찾을 수 없습니다.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  infoBox: { marginBottom: 20 },
  info: { fontSize: 16, color: '#444', marginBottom: 8 },
  mapContainer: { height: 250, marginTop: 10, borderRadius: 15, overflow: 'hidden', backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  map: { width: '100%', height: '100%' }
});