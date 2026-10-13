import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { RouteCoordinate } from '../../store/useNavigationStore';
import { MapStyleType } from '../../store/useMapStore';

interface GoogleMapViewProps {
  partnerLocation?: { latitude: number; longitude: number; heading?: number | null };
  pickupLocation?: { latitude: number; longitude: number; name?: string };
  dropLocation?: { latitude: number; longitude: number; name?: string };
  polyline?: RouteCoordinate[];
  showTraffic?: boolean;
  mapStyle?: MapStyleType;
  height?: number | string;
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0F172A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0F172A' }] },
  { featureType: 'administrative', elementType: 'country', stylers: [{ color: '#1E293B' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1E293B' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E293B' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#0D7855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#065F46' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0284C7' }] },
];

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  partnerLocation = { latitude: 19.1197, longitude: 72.9056, heading: 45 },
  pickupLocation = { latitude: 19.1210, longitude: 72.9080, name: 'Chef Ananya' },
  dropLocation = { latitude: 19.1245, longitude: 72.9120, name: 'Vikram Malhotra' },
  polyline = [],
  showTraffic = true,
  mapStyle = 'DARK',
  height = 320,
}) => {
  const { colors, radius, shadows } = useTheme();
  const mapRef = useRef<MapView | null>(null);

  const defaultRegion = {
    latitude: partnerLocation.latitude || 19.1197,
    longitude: partnerLocation.longitude || 72.9056,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  useEffect(() => {
    if (mapRef.current && partnerLocation.latitude && partnerLocation.longitude) {
      mapRef.current.animateToRegion({
        latitude: partnerLocation.latitude,
        longitude: partnerLocation.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 500);
    }
  }, [partnerLocation.latitude, partnerLocation.longitude]);

  // Construct coordinates array for polyline overlay
  const polylineCoords = polyline.length > 0
    ? polyline.map((pt) => ({ latitude: pt.latitude, longitude: pt.longitude }))
    : [
        { latitude: partnerLocation.latitude, longitude: partnerLocation.longitude },
        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
        { latitude: dropLocation.latitude, longitude: dropLocation.longitude },
      ];

  const getTileUrl = () => {
    switch (mapStyle) {
      case 'DARK':
        return 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
      case 'SATELLITE':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      default:
        return 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
    }
  };

  return (
    <View
      style={[
        styles.mapContainer,
        {
          height: typeof height === 'number' ? height : 320,
          borderRadius: radius.large,
          borderColor: colors.border,
          borderWidth: 1,
          ...shadows.md,
        },
      ]}
    >
      {/* Map Header Overlay */}
      <View style={styles.topInfoBar}>
        <View style={[styles.styleTag, { backgroundColor: colors.surfaceElevated }]}>
          <Text variant="caption" weight="bold" color="primary">
            {mapStyle} MAP {showTraffic ? '• TRAFFIC ON' : ''}
          </Text>
        </View>
      </View>

      {/* Interactive MapView */}
      <MapView
        ref={mapRef}
        style={styles.mapView}
        provider={PROVIDER_GOOGLE}
        initialRegion={defaultRegion}
        showsUserLocation={false}
        showsTraffic={showTraffic}
        customMapStyle={mapStyle === 'DARK' ? DARK_MAP_STYLE : undefined}
        mapType={mapStyle === 'SATELLITE' ? 'satellite' : 'standard'}
      >
        {/* Tile Overlay for Web / Fallback rendering */}
        <UrlTile
          urlTemplate={getTileUrl()}
          maximumZ={19}
          tileSize={256}
        />

        {/* Route Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#0D7855"
            strokeWidth={4}
          />
        )}

        {/* Partner Location Marker with Direction Arrow */}
        <Marker
          coordinate={{
            latitude: partnerLocation.latitude,
            longitude: partnerLocation.longitude,
          }}
          title="Rider Position"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={[styles.markerWrapper, { transform: [{ rotate: `${partnerLocation.heading || 0}deg` }] }]}>
            <View style={[styles.partnerPulseCircle, { backgroundColor: '#0D785533' }]}>
              <View style={[styles.partnerCenterDot, { backgroundColor: '#0D7855' }]}>
                <Icon name="navigation" size={14} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </Marker>

        {/* Pickup Location Marker */}
        <Marker
          coordinate={{
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          }}
          title={pickupLocation.name || 'Pickup Kitchen'}
        >
          <View style={styles.markerWrapper}>
            <View style={[styles.pinBadge, { backgroundColor: '#059669' }]}>
              <Icon name="storefront" size={14} color="#FFFFFF" />
            </View>
            {pickupLocation.name ? (
              <View style={styles.labelBubble}>
                <Text variant="caption" weight="extrabold" style={styles.pinText}>
                  {pickupLocation.name}
                </Text>
              </View>
            ) : null}
          </View>
        </Marker>

        {/* Drop Location Marker */}
        <Marker
          coordinate={{
            latitude: dropLocation.latitude,
            longitude: dropLocation.longitude,
          }}
          title={dropLocation.name || 'Customer Location'}
        >
          <View style={styles.markerWrapper}>
            <View style={[styles.pinBadge, { backgroundColor: '#EF4444' }]}>
              <Icon name="home" size={14} color="#FFFFFF" />
            </View>
            {dropLocation.name ? (
              <View style={styles.labelBubble}>
                <Text variant="caption" weight="extrabold" style={styles.pinText}>
                  {dropLocation.name}
                </Text>
              </View>
            ) : null}
          </View>
        </Marker>
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  topInfoBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  styleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerPulseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerCenterDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  labelBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  pinText: {
    fontSize: 10,
    color: '#0F172A',
  },
});

export default GoogleMapView;
