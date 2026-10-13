import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Region } from './Map';
import { Ionicons } from '@expo/vector-icons';

export interface LatLng {
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  visible: boolean;
  initialLocation?: LatLng;
  onLocationSelect: (location: LatLng) => void;
  onCancel: () => void;
}

// Reasonable fallback center when no initial location and location permission
// is denied/unavailable (rather than defaulting to null and showing an empty map).
const FALLBACK_REGION: Region = {
  latitude: 19.076,
  longitude: 72.8777,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/**
 * Full-screen map modal for pinning an address's exact coordinates during
 * onboarding (chef kitchen address, consumer delivery address). Lets the
 * user either tap/drag a pin on the map or jump to their current GPS
 * location, then confirms a single lat/lng pair back to the caller.
 */
export function LocationPicker({ visible, initialLocation, onLocationSelect, onCancel }: LocationPickerProps) {
  const [region, setRegion] = useState<Region>({
    ...FALLBACK_REGION,
    ...(initialLocation || {}),
  });
  const [markerCoords, setMarkerCoords] = useState<LatLng | undefined>(initialLocation);
  const [locating, setLocating] = useState(false);

  const handleMapPress = (e: any) => {
    setMarkerCoords(e.nativeEvent.coordinate);
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'Allow location access to auto-fill your current position, or tap the map to place the pin manually.'
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setMarkerCoords(coords);
      setRegion((r) => ({ ...r, ...coords }));
    } catch (e) {
      console.warn('[LocationPicker] Failed to get current location:', e);
      Alert.alert('Could not fetch location', 'Please try again, or tap the map to place the pin manually.');
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = () => {
    if (markerCoords) {
      onLocationSelect(markerCoords);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} hitSlop={12}>
            <Text style={styles.headerAction}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pin your location</Text>
          <View style={{ width: 50 }} />
        </View>

        <MapView
          style={styles.map}
          initialRegion={region}
          onPress={handleMapPress}
        >
          {markerCoords && <Marker coordinate={markerCoords} />}
        </MapView>

        <TouchableOpacity
          style={styles.currentLocationFab}
          onPress={handleUseCurrentLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#17211c" />
          ) : (
            <Ionicons name="locate" size={22} color="#17211c" />
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.hint}>
            {markerCoords ? 'Tap the map to adjust the pin.' : 'Tap the map to drop a pin, or use your current location.'}
          </Text>
          <TouchableOpacity
            style={[styles.button, !markerCoords && styles.buttonDisabled]}
            disabled={!markerCoords}
            onPress={handleConfirm}
          >
            <Text style={styles.buttonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee9df',
  },
  headerAction: {
    fontSize: 15,
    color: '#66736c',
    width: 50,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17211c',
  },
  map: {
    flex: 1,
  },
  currentLocationFab: {
    position: 'absolute',
    right: 16,
    bottom: 132,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee9df',
  },
  hint: {
    fontSize: 12,
    color: '#66736c',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#17211c',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#c9c2b6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
