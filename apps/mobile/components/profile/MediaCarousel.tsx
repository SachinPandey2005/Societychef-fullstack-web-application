import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, Dimensions, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/useThemeStore';
import { KitchenMedia } from '../../types';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.8, 300);

const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop';

interface MediaCarouselProps {
  title?: string;
  media: KitchenMedia[];
  onPressMedia?: (media: KitchenMedia) => void;
  isEditable?: boolean;
  onAddMedia?: () => void;
  onDeleteMedia?: (media: KitchenMedia) => void;
  mediaTypeLabel?: string;
  hideAddCardIfMediaPresent?: boolean;
}

function MediaCardItem({
  item,
  onPressMedia,
  isEditable,
  onDeleteMedia,
  styles,
  Colors,
}: {
  item: KitchenMedia;
  onPressMedia?: (m: KitchenMedia) => void;
  isEditable?: boolean;
  onDeleteMedia?: (m: KitchenMedia) => void;
  styles: any;
  Colors: any;
}) {
  const initialUri = (typeof item?.thumbnail === 'string' && item.thumbnail.length > 0)
    ? item.thumbnail
    : (typeof item?.url === 'string' && item.url.length > 0 ? item.url : DEFAULT_PLACEHOLDER);

  const [imgUri, setImgUri] = useState<string>(initialUri);

  return (
    <View style={styles.cardContainer}>
      <Pressable style={styles.card} onPress={() => onPressMedia?.(item)}>
        <Image
          source={{ uri: imgUri }}
          style={styles.image}
          onError={() => setImgUri(DEFAULT_PLACEHOLDER)}
        />
        {item.type === 'video' && (
          <View style={styles.playButton}>
            <Ionicons name="play" size={32} color="#fff" />
          </View>
        )}
        {item.caption ? (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{item.caption}</Text>
          </View>
        ) : null}
      </Pressable>
      {isEditable && (
        <Pressable style={styles.deleteBadge} onPress={() => onDeleteMedia?.(item)}>
          <Ionicons name="trash" size={20} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

export function MediaCarousel({
  title,
  media,
  onPressMedia,
  isEditable,
  onAddMedia,
  onDeleteMedia,
  mediaTypeLabel,
  hideAddCardIfMediaPresent,
}: MediaCarouselProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const resolvedMediaTypeLabel = mediaTypeLabel ?? t('common.media', 'Media');
  const [selectedMedia, setSelectedMedia] = useState<KitchenMedia | null>(null);

  if (media.length === 0 && !isEditable) return null;

  function handlePress(item: KitchenMedia) {
    if (onPressMedia) {
      onPressMedia(item);
    } else {
      setSelectedMedia(item);
    }
  }

  const showAddCard = isEditable && !(hideAddCardIfMediaPresent && media.length > 0);

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      <FlatList
        data={showAddCard ? [...media, { id: 'add-new-btn' } as any] : media}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        keyExtractor={m => m.id}
        renderItem={({ item }) => {
          if (item.id === 'add-new-btn') {
            return (
              <Pressable style={styles.addCard} onPress={onAddMedia}>
                <Ionicons name="add" size={48} color={Colors.muted} />
                <Text style={styles.addText}>{t('mediaCarousel.addLabel', { defaultValue: 'Add {{label}}', label: resolvedMediaTypeLabel })}</Text>
              </Pressable>
            );
          }
          return (
            <MediaCardItem
              item={item}
              onPressMedia={handlePress}
              isEditable={isEditable}
              onDeleteMedia={onDeleteMedia}
              styles={styles}
              Colors={Colors}
            />
          );
        }}
      />

      {/* Full Media Preview Modal */}
      <Modal visible={selectedMedia !== null} transparent animationType="fade" onRequestClose={() => setSelectedMedia(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedMedia(null)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Pressable style={styles.closeBtn} onPress={() => setSelectedMedia(null)}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>

            {selectedMedia && (
              <Image
                source={{ uri: selectedMedia.url || selectedMedia.thumbnail || DEFAULT_PLACEHOLDER }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}

            {selectedMedia?.type === 'video' && (
              <View style={styles.videoOverlayBadge}>
                <Ionicons name="videocam" size={18} color="#fff" />
                <Text style={styles.videoOverlayText}>{t('mediaCarousel.videoTour', 'Kitchen Video Tour')}</Text>
              </View>
            )}

            {selectedMedia?.caption ? (
              <View style={styles.modalCaptionBox}>
                <Text style={styles.modalCaptionText}>{selectedMedia.caption}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.2,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  addCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.2,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  addText: {
    color: Colors.muted,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -28,
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 48,
    backgroundColor: 'transparent',
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    ...Platform.select({
      web: { textShadow: '0px 1px 4px rgba(0,0,0,0.5)' },
      default: {
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },
  deleteBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 600,
    maxHeight: height * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: -40,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalImage: {
    width: '100%',
    height: height * 0.55,
    borderRadius: 16,
  },
  videoOverlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  videoOverlayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalCaptionBox: {
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalCaptionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
