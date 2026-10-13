import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';

interface ProfilePromptCardProps {
  prompt: string;
  answer: string;
  isEditable?: boolean;
  onEdit?: () => void;
}

export function ProfilePromptCard({ prompt, answer, isEditable, onEdit }: ProfilePromptCardProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <Pressable style={styles.card} onPress={isEditable ? onEdit : undefined}>
      <View style={styles.header}>
        <Text style={styles.prompt}>{prompt}</Text>
        {isEditable && <Ionicons name="pencil" size={16} color={Colors.muted} />}
      </View>
      <Text style={styles.answer}>{answer}</Text>
    </Pressable>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0px 2px 10px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      },
    }),
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prompt: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answer: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark,
    lineHeight: 30,
  },
});
