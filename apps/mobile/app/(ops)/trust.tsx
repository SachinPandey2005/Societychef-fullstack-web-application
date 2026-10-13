import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ScreenTitle } from '../../components/ui/ScreenTitle';
import { apiClient } from '../../lib/apiClient';

type FlaggedKitchen = { id: string; name: string; reason: string };

type TrustCardProps = {
  title: string;
  body: string;
  type: 'Required' | 'Future';
};

function TrustCard({ title, body, type }: TrustCardProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <Card>
      <Badge label={type} tone={type === 'Required' ? 'blue' : 'gold'} small />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </Card>
  );
}

const CHECKLIST_ITEMS = [
  'Clean cooking area and utensils',
  'Food stored at correct temperatures',
  'Personal hygiene maintained',
  'No pets in cooking area',
  'Waste managed properly',
];

export default function TrustScreen() {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const { showToast } = useToast();

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [flaggedKitchens, setFlaggedKitchens] = useState<FlaggedKitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviewingKitchen, setReviewingKitchen] = useState<FlaggedKitchen | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadFlagged();
  }, []);

  async function loadFlagged() {
    setLoading(true);
    setLoadError('');
    try {
      const response = await apiClient.get('/crm/verification');
      const rows = response?.data || [];
      setFlaggedKitchens(
        rows.map((v: any) => ({
          id: v.id,
          name: v.kitchen_profiles?.name || v.kitchen_profiles?.chef_name || 'Unnamed kitchen',
          reason: v.verification_notes || 'Pending kitchen verification',
        }))
      );
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load flagged kitchens.');
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(item: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  }

  async function handleApprove(id: string, name: string) {
    setApproving(true);
    try {
      await apiClient.patch(`/crm/verification/${id}/status`, { status: 'APPROVED' });
      setFlaggedKitchens((prev) => prev.filter((k) => k.id !== id));
      setReviewingKitchen(null);
      showToast(`Approved ${name} — Flag cleared!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Could not approve this kitchen.', 'error');
    } finally {
      setApproving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Pressable
            onPress={() => router.replace('/landing')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.surface,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: Colors.border,
              gap: 4,
            }}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.primary }}>Landing</Text>
          </Pressable>
          <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5 }}>
            TRUST & COMPLIANCE
          </Text>
        </View>

        <ScreenTitle
          eyebrow="Trust"
          title="Privacy, hygiene, reports, and compliance."
        />

        {/* MVP checklist */}
        <Text style={styles.sectionLabel}>MVP CHECKLIST</Text>
        <View style={styles.trustList}>
          <TrustCard
            type="Required"
            title="Phone OTP verification"
            body="Every account starts with verified mobile identity."
          />
          <TrustCard
            type="Required"
            title="Society and flat capture"
            body="Address captured for ops even when listing is anonymous."
          />
          <TrustCard
            type="Required"
            title="Anonymous public listing"
            body="Chef name and flat can stay hidden from consumers."
          />
          <TrustCard
            type="Required"
            title="Hygiene checklist"
            body="Required before paid launch. Becomes a visible badge."
          />
          <TrustCard
            type="Required"
            title="Ratings and reports"
            body="Post-order quality and safety reporting by consumers."
          />
          <TrustCard
            type="Future"
            title="FSSAI guidance"
            body="Move from guidance to verification as scale increases."
          />
        </View>

        {/* Hygiene checklist panel */}
        <Text style={styles.sectionLabel}>HYGIENE CHECKLIST</Text>
        <Card>
          <Text style={styles.panelTitle}>Kitchen hygiene checklist</Text>
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = checked.has(item);
            return (
              <Pressable
                key={item}
                style={styles.checklistRow}
                onPress={() => toggleItem(item)}
              >
                <Ionicons
                  name={isChecked ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={isChecked ? Colors.primary : Colors.muted}
                />
                <Text
                  style={[
                    styles.checklistLabel,
                    isChecked && styles.checklistLabelChecked,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </Card>

        {/* Flagged kitchens panel */}
        <Text style={styles.sectionLabel}>FLAGGED KITCHENS</Text>
        <Card>
          <View style={styles.flaggedHeader}>
            <Text style={styles.panelTitle}>Flagged for review</Text>
            <Badge label={`${flaggedKitchens.length} pending`} tone={flaggedKitchens.length > 0 ? 'red' : 'green'} small />
          </View>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
          ) : loadError ? (
            <Text style={{ color: Colors.red, fontSize: 13, paddingVertical: 12 }}>{loadError}</Text>
          ) : flaggedKitchens.length === 0 ? (
            <Text style={{ color: Colors.muted, fontSize: 13, paddingVertical: 12 }}>
              ✓ All flagged kitchens reviewed and verified!
            </Text>
          ) : (
            flaggedKitchens.map((kitchen, index) => (
              <View
                key={kitchen.id}
                style={[
                  styles.flaggedRow,
                  index < flaggedKitchens.length - 1 && styles.flaggedRowBorder,
                ]}
              >
                <View style={styles.flaggedInfo}>
                  <Text style={styles.flaggedName}>{kitchen.name}</Text>
                  <Text style={styles.flaggedReason}>{kitchen.reason}</Text>
                </View>
                <Button
                  label="Review"
                  onPress={() => setReviewingKitchen(kitchen)}
                  variant="secondary"
                />
              </View>
            ))
          )}
        </Card>

        {/* Review Modal */}
        <Modal
          visible={Boolean(reviewingKitchen)}
          transparent
          animationType="fade"
          onRequestClose={() => setReviewingKitchen(null)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Card style={{ width: '100%', maxWidth: 400, padding: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.dark, marginBottom: 6 }}>
                Review {reviewingKitchen?.name}
              </Text>
              <Text style={{ fontSize: 13, color: Colors.muted, marginBottom: 16 }}>
                Reason: {reviewingKitchen?.reason}
              </Text>

              <View style={{ gap: 10 }}>
                <Button
                  label={approving ? 'Approving…' : 'Approve Hygiene & Clear Flag'}
                  variant="primary"
                  disabled={approving}
                  onPress={() => reviewingKitchen && handleApprove(reviewingKitchen.id, reviewingKitchen.name)}
                />
                <Button
                  label="Close"
                  variant="secondary"
                  disabled={approving}
                  onPress={() => setReviewingKitchen(null)}
                />
              </View>
            </Card>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionLabel: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  trustList: {
    gap: 12,
    marginBottom: 24,
  },
  cardTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 8,
  },
  cardBody: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  panelTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checklistLabel: {
    color: Colors.dark,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  checklistLabelChecked: {
    color: Colors.muted,
    textDecorationLine: 'line-through',
  },
  flaggedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  flaggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  flaggedRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  flaggedInfo: {
    flex: 1,
  },
  flaggedName: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '900',
  },
  flaggedReason: {
    color: Colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
});
