import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';

interface HygieneCardProps {
  title: string;
  description: string;
  confirmed: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  isEditable?: boolean;
  onToggle?: () => void;
}

export function HygieneCard({ title, description, confirmed, icon, isEditable, onToggle }: HygieneCardProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={28} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Pressable style={styles.status} onPress={isEditable ? onToggle : undefined}>
        {confirmed ? (
          <Ionicons name="checkmark-circle" size={28} color={Colors.green} />
        ) : (
          <Ionicons name="close-circle" size={28} color={Colors.border} />
        )}
      </Pressable>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.muted,
  },
  status: {
    marginLeft: 12,
  }
});
