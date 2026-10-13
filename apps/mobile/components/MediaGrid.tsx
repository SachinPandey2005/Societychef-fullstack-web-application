import { View, Image, StyleSheet, Pressable, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/useThemeStore';
import { KitchenMedia } from '../types';

interface MediaGridProps {
  media: KitchenMedia[];
  onAdd?: () => void;
  onDelete?: (id: string) => void;
  isEditable?: boolean;
}

export function MediaGrid({ media, onAdd, onDelete, isEditable }: MediaGridProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {isEditable && onAdd && (
        <Pressable style={styles.addTile} onPress={onAdd}>
          <Ionicons name="add" size={32} color={Colors.primary} />
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      )}
      
      {media.map((item) => (
        <View key={item.id} style={styles.mediaTile}>
          {item.type === 'image' ? (
            <Image source={{ uri: item.url }} style={styles.image} />
          ) : (
            <View style={styles.videoContainer}>
              <Image source={{ uri: item.url }} style={styles.image} />
              <View style={styles.playOverlay}>
                <Ionicons name="play-circle" size={40} color="white" />
              </View>
            </View>
          )}
          
          {isEditable && onDelete && (
            <Pressable style={styles.deleteBtn} onPress={() => onDelete(item.id)}>
              <Ionicons name="trash" size={16} color="white" />
            </Pressable>
          )}
        </View>
      ))}
      {media.length === 0 && !isEditable && (
        <Text style={styles.emptyText}>No media uploaded yet.</Text>
      )}
    </ScrollView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 8,
  },
  addTile: {
    width: 120,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  addText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  mediaTile: {
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 14,
    fontStyle: 'italic',
    padding: 12,
  },
});
