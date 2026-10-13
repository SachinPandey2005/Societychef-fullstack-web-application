import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, Platform, Share } from 'react-native';
// react-native's own SafeAreaView is a no-op on Android (doesn't apply
// status-bar insets, especially with edgeToEdgeEnabled: true) — use the real
// one, consistent with every other screen in this app.
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { apiClient } from '../../lib/apiClient';

export default function OpsFinanceDashboard() {
  const [loading, setLoading] = useState(false);

  const handleExport = async (type: string) => {
    try {
      setLoading(true);
      // The backend returns a raw CSV file (Content-Type: text/csv), not
      // JSON. apiClient.get() always calls res.json() on the response, which
      // throws immediately on CSV — meaning this always hit the catch block
      // below on any real backend reply. It ALSO always showed "Export
      // Successful" regardless, since that alert wasn't inside a success
      // check at all. getRawText() reads the response as text instead, and
      // the outcome shown now actually reflects whether the request worked.
      const csv = await apiClient.getRawText(
        `/finance/export?type=${type}&start_date=2024-01-01&end_date=2025-12-31`
      );

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}_report.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // No file-system/sharing dependency is set up yet for native, so we
        // can't write this straight to disk — hand it to the OS share sheet
        // (Files, Mail, Drive, etc. can all save a shared text payload) using
        // React Native's built-in Share API rather than pretending a
        // "download" happened.
        await Share.share({
          title: `${type}_report.csv`,
          message: csv,
        });
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Unable to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const handleReconciliation = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/finance/reconciliation');
      if (res.success && res.data.mismatches === 0) {
        Alert.alert('Reconciliation Passed', 'All ledgers perfectly balance!');
      } else {
        Alert.alert('Reconciliation Failed', `Found ${res.data?.mismatches ?? '?'} mismatches. Check logs.`);
      }
    } catch (err: any) {
      Alert.alert('Audit Failed', err?.message || 'Unable to run reconciliation engine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Ops Financial Dashboard', headerShadowVisible: false }} />
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Platform Integrity</Text>
          <Text style={styles.cardDescription}>Audit the global financial ledger across all wallets.</Text>
          <TouchableOpacity style={styles.buttonPrimary} onPress={handleReconciliation} disabled={loading}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={styles.buttonTextPrimary}>Run Reconciliation Engine</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Reports & Analytics</Text>
        
        <View style={styles.cardRow}>
          <TouchableOpacity style={styles.cardHalf} onPress={() => handleExport('orders')} disabled={loading}>
            <Ionicons name="document-text" size={32} color={Colors.primary} />
            <Text style={styles.cardHalfText}>Order Revenue CSV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cardHalf} onPress={() => handleExport('settlements')} disabled={loading}>
            <Ionicons name="cash" size={32} color={Colors.primary} />
            <Text style={styles.cardHalfText}>Settlements CSV</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  cardDescription: { fontSize: 14, color: '#666', marginBottom: 16 },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
  },
  buttonTextPrimary: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, marginTop: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardHalf: {
    backgroundColor: '#fff',
    flex: 0.48,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  cardHalfText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'center' }
});
