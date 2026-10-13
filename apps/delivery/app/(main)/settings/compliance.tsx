import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/Icon';
import { useComplianceStore } from '../../../store/useComplianceStore';
import { ComplianceRepository } from '../../../repositories/ComplianceRepository';

export default function ComplianceDocsScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { documents, isLoading } = useComplianceStore();

  useEffect(() => {
    ComplianceRepository.fetchCompliance();
  }, []);

  const handleRefresh = async () => {
    await ComplianceRepository.fetchCompliance();
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Legal & Compliance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout onRefresh={handleRefresh} refreshing={isLoading}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>

          <Text variant="caption" color="secondary" style={{ fontSize: 11 }}>
            Read the corporate legal guidelines, licenses, and contractual agreements governing the delivery logistics operations.
          </Text>

          {/* Compliance List */}
          <View style={{ gap: spacing.md }}>
            {documents.map((doc) => (
              <Card key={doc.id} style={{ padding: spacing.md }}>
                <View style={styles.docHeader}>
                  <Text variant="caption" weight="bold" color="primary">{doc.title}</Text>
                  <Text variant="caption" style={{ fontSize: 8, color: colors.textMuted }}>
                    VERSION {doc.version}
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.outlineVariant, marginVertical: spacing.sm }]} />

                <Text variant="caption" color="secondary" style={{ fontSize: 12, lineHeight: 18 }}>
                  {doc.content}
                </Text>

                <View style={styles.docFooter}>
                  <Text variant="caption" style={{ fontSize: 8, color: colors.textMuted }}>
                    Last Updated: {new Date(doc.updated_at).toLocaleDateString()}
                  </Text>
                </View>
              </Card>
            ))}

            {documents.length === 0 && (
              <Text variant="caption" color="secondary" align="center" style={{ paddingVertical: spacing.xl }}>
                Loading compliance documents...
              </Text>
            )}
          </View>

        </View>
      </ScrollableLayout>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  docFooter: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
});
