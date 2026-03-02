import React from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

export default function ShowMapView({ coords, title }: any) {
  if (!coords) return null;

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={coords}
        scrollEnabled={false}
      >
        <Marker coordinate={coords} title={title} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: { 
    width: '100%', 
    height: '100%',
    backgroundColor: '#f0f0f0' 
  },
  map: { 
    width: '100%', 
    height: '100%' 
  },
});