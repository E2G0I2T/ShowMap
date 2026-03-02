import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ShowMapView({ coords, title, address }: any) {
  // address가 있으면 검색 쿼리로, 없으면 좌표로
  const mapUrl = address 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
    : coords
    ? `https://maps.google.com/maps?q=${coords.latitude},${coords.longitude}&z=15&output=embed`
    : "";

  if (!mapUrl) return null;
  
  return (
    <View style={styles.mapContainer}>
      <iframe
        title="Google Maps"
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: { 
    width: '100%', 
    height: '100%',
    backgroundColor: '#f0f0f0' 
  },
});