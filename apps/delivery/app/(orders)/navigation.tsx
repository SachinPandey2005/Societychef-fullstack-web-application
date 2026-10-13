import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../components/layout/ScrollableLayout';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';

// Stores & Repositories
import { useLocationStore } from '../../store/useLocationStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useTrackingStore } from '../../store/useTrackingStore';
import { useETAStore } from '../../store/useETAStore';
import { useMapStore } from '../../store/useMapStore';
import { useOrderStore } from '../../store/useOrderStore';

import { NavigationRepository } from '../../repositories/NavigationRepository';
import { TrackingRepository } from '../../repositories/TrackingRepository';
import { GeofenceService } from '../../services/geofence.service';
import { EtaEngineService } from '../../services/etaEngine.service';

// Map Components
import {
  GoogleMapView,
  NavigationHeader,
  NavigationBottomSheet,
  RouteInfoCard,
  GeofenceAlertBanner,
  FloatingMapControls,
  PermissionPromptModal,
  MapOfflineNotice,
} from '../../components/maps';

export default function NavigationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, spacing } = useTheme();
  const { showToast } = useToast();

  const { currentLocation, startStreaming, isStreaming } = useLocationStore();
  const { polyline, routeType, distanceKm, durationMinutes, setRouteType } = useNavigationStore();
  const { geofenceStatus, distanceToTargetMeters, startSession } = useTrackingStore();
  const { pickupEtaMinutes, deliveryEtaMinutes, trafficDelayMinutes } = useETAStore();
  const { mapStyle, showTraffic, recenterTriggerCount } = useMapStore();
  const { activeOrder } = useOrderStore();

  const [permModalVisible, setPermModalVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Start continuous high accuracy location streaming
    startStreaming();
    TrackingRepository.startTrackingSession((id as string) || 'ord-101');

    // Calculate initial route & ETA
    NavigationRepository.calculateRoute(19.1197, 72.9056, 19.1245, 72.9120, routeType);
    EtaEngineService.calculateEta(2.4, 25, 2);
  }, []);

  useEffect(() => {
    // Evaluate Geofence radius on location update
    if (currentLocation) {
      GeofenceService.evaluatePosition(
        currentLocation.latitude,
        currentLocation.longitude,
        19.1245,
        72.9120,
        'CUSTOMER'
      );
    }
  }, [currentLocation]);

  const handleRouteTypeChange = (type: any) => {
    setRouteType(type);
    NavigationRepository.calculateRoute(19.1197, 72.9056, 19.1245, 72.9120, type);
    showToast(`Recalculated ${type} route`, 'info');
  };

  return (
    <ScreenWrapper>
      <ScrollableLayout contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Navigation Header with turn-by-turn & speed */}
        <NavigationHeader
          currentInstruction="Head north on Central Avenue towards Gate 1"
          distanceMeters={400}
          speedKmh={Math.round((currentLocation?.speed || 6.8) * 3.6)}
          headingAngle={Math.round(currentLocation?.heading || 45)}
          onExit={() => router.back()}
        />

        <MapOfflineNotice isOffline={isOffline} />

        {/* Geofence Arrival Alert Banner */}
        <GeofenceAlertBanner
          status={geofenceStatus}
          distanceMeters={distanceToTargetMeters}
          onConfirmArrival={() => showToast('Arrival Confirmed! Updating order status...', 'success')}
        />

        {/* Route Optimization Selector */}
        <RouteInfoCard selectedType={routeType} onSelectRouteType={handleRouteTypeChange} />

        {/* Map Canvas View */}
        <View style={styles.mapWrap}>
          <GoogleMapView
            partnerLocation={{
              latitude: currentLocation?.latitude || 19.1197,
              longitude: currentLocation?.longitude || 72.9056,
              heading: currentLocation?.heading || 45,
            }}
            pickupLocation={{ latitude: 19.1210, longitude: 72.9080, name: activeOrder?.kitchen?.name || 'Chef Ananya' }}
            dropLocation={{ latitude: 19.1245, longitude: 72.9120, name: activeOrder?.customer?.full_name || 'Vikram Malhotra' }}
            polyline={polyline}
            showTraffic={showTraffic}
            mapStyle={mapStyle}
            height={360}
          />

          {/* Floating Map Controls overlay */}
          <FloatingMapControls
            onRecenter={() => {
              showToast('Recenter map view to current position', 'info');
            }}
          />
        </View>

        {/* Bottom Sheet displaying ETA, Distance & Shortcuts */}
        <NavigationBottomSheet
          pickupEta={pickupEtaMinutes}
          deliveryEta={deliveryEtaMinutes}
          distanceKm={distanceKm}
          trafficDelayMins={trafficDelayMinutes}
          pickupName={activeOrder?.kitchen?.name || 'Home Chef Ananya'}
          dropName={activeOrder?.customer?.full_name || 'Vikram Malhotra'}
          destLat={19.1245}
          destLng={72.9120}
          onCallChef={() => showToast(`Calling Chef ${activeOrder?.kitchen?.chef_name || 'Ananya'}...`, 'info')}
          onCallCustomer={() => showToast(`Calling Customer ${activeOrder?.customer?.full_name || 'Vikram'}...`, 'info')}
          onEmergencySos={() => showToast('Emergency SOS alert dispatched to CRM!', 'error')}
        />
      </ScrollableLayout>

      {/* Permissions Modal */}
      <PermissionPromptModal
        visible={permModalVisible}
        onClose={() => setPermModalVisible(false)}
        onGrantPermissions={() => {
          startStreaming();
          showToast('GPS & Location permissions granted', 'success');
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    position: 'relative',
    marginVertical: 10,
  },
});
