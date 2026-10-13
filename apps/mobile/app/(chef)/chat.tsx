import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ImageBackground,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { LanguageTogglePill } from '../../components/LanguageTogglePill';
import { useThemeStore } from '../../store/useThemeStore';
import { ScreenTitle } from '../../components/ui/ScreenTitle';
import { Pill } from '../../components/ui/Pill';
import type { Message } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import {
  getChatThreads,
  getChatMessages,
  sendMessage,
  subscribeToChat,
  sendTypingIndicator,
  markThreadRead,
} from '../../services';

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  if (!name) return 'R';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const CHEF_QUICK_REPLY_KEYS = [
  { key: 'chat.quickReplyReady', fallback: 'Order is ready! 🍳' },
  { key: 'chat.quickReplyPreparing', fallback: 'Preparing now... ⏱️' },
  { key: 'chat.quickReply15m', fallback: 'Will be ready in 15m ⏳' },
  { key: 'chat.quickReplyOut', fallback: 'Out for delivery! 🛵' },
  { key: 'chat.quickReplyThanks', fallback: 'Thank you for ordering! 🙏' },
];

export default function ChefChatScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const styles = getStyles(Colors, isDark);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // See the matching comment in (consumer)/chat.tsx — the bottom tab bar
  // stays mounted/visible on this hidden Tabs.Screen route too, reserving
  // space the KeyboardAvoidingView can't account for.
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        parent?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation])
  );

  const params = useLocalSearchParams<{ consumerId?: string; consumerName?: string }>();
  const consumerIdParam = params?.consumerId;
  const consumerNameParam = params?.consumerName;

  const { user } = useAuthStore();
  const userId = user?.id || 'chef-1';
  const role = 'chef';

  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [lastReadByOther, setLastReadByOther] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // See the matching comment in (consumer)/chat.tsx — KeyboardAvoidingView's
  // Android compensation never fired on this device (confirmed via live
  // screenshots), so Android is driven by a manual keyboard-height listener
  // instead, applied directly as paddingBottom.
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setAndroidKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Load chef chat threads
  const loadThreads = async () => {
    try {
      const data = await getChatThreads(userId, 'chef');
      let updatedThreads = [...data];

      if (consumerIdParam) {
        const decodedName = consumerNameParam ? decodeURIComponent(consumerNameParam) : t('chat.resident', 'Resident');
        let targetThread = updatedThreads.find(
          (th) => th.consumerId === consumerIdParam || th.id === `thread_${consumerIdParam}`
        );

        if (!targetThread) {
          targetThread = {
            id: `thread_${consumerIdParam}`,
            consumerId: consumerIdParam,
            consumerName: decodedName,
            consumerFlat: 'A-801',
            society: 'Lotus Heights',
            lastMessage: t('chat.startedNewConversation', 'Started a new conversation'),
            lastActivity: new Date().toISOString(),
            unreadCount: 0,
          };
          updatedThreads = [targetThread, ...updatedThreads];
        }

        setThreads(updatedThreads);
        setActiveThread(targetThread);
        return;
      }

      setThreads(updatedThreads);
    } catch (e) {
      console.warn('Failed to load chef chat threads:', e);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [userId, consumerIdParam, consumerNameParam]);

  // Load messages when active thread changes
  useEffect(() => {
    async function loadMessages() {
      if (!activeThread?.id) return;
      try {
        const data = await getChatMessages(activeThread.id);
        setMessages(data);
        markThreadRead(activeThread.id, role);
      } catch (e) {
        console.warn('Failed to load chat messages:', e);
      }
    }
    setOtherTyping(false);
    setLastReadByOther(null);
    loadMessages();
  }, [activeThread]);

  // Real-time chat subscription
  useEffect(() => {
    if (!activeThread?.id || !userId) return;

    const unsubscribe = subscribeToChat(
      activeThread.id,
      userId,
      (newMsg) => {
        setMessages((prev) => {
          const isDuplicate = prev.some(
            (m) =>
              m.text === newMsg.text &&
              m.from === newMsg.from &&
              Math.abs(new Date(m.timestamp).getTime() - new Date(newMsg.timestamp).getTime()) < 2000
          );
          if (isDuplicate) return prev;
          return [...prev, newMsg];
        });

        // Update thread list preview text
        setThreads((prev) =>
          prev.map((th) =>
            th.id === activeThread.id
              ? { ...th, lastMessage: newMsg.text || t('chat.sentPhoto', 'Sent photo'), lastActivity: newMsg.timestamp }
              : th
          )
        );

        if (newMsg.from !== role) {
          setOtherTyping(false);
          markThreadRead(activeThread.id, role);
        }
      },
      (fromRole, isTyping) => {
        if (fromRole !== role) setOtherTyping(isTyping);
      },
      (fromRole) => {
        if (fromRole !== role) setLastReadByOther(new Date().toISOString());
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeThread?.id, userId, role]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeThread) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, activeThread]);

  function stopTyping() {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current && activeThread?.id) {
      isTypingRef.current = false;
      sendTypingIndicator(activeThread.id, role, false);
    }
  }

  function handleDraftChange(text: string) {
    setDraft(text);
    if (!activeThread?.id) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingIndicator(activeThread.id, role, true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 2000);
  }

  async function handleSend(mediaUrl?: string) {
    const text = draft.trim();
    if ((!text && !mediaUrl) || !activeThread?.id || sending) return;

    setDraft('');
    setSending(true);
    stopTyping();

    const tempMsg: Message = {
      from: role,
      text: text || '',
      mediaUrl,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    // Optimistic thread preview update
    setThreads((prev) =>
      prev.map((th) =>
        th.id === activeThread.id
          ? { ...th, lastMessage: text || t('chat.sentPhoto', 'Sent photo'), lastActivity: tempMsg.timestamp }
          : th
      )
    );

    try {
      await sendMessage(activeThread.id, text, role, mediaUrl);
    } catch (e) {
      console.warn('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  }

  async function handlePickImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('chat.permissionNeeded', 'Permission needed'), t('chat.allowPhotoDishAccess', 'Please allow access to your photo library to share dish photos.'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        handleSend(selectedUri);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  }

  // Filter threads by search query
  const filteredThreads = threads.filter((th) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (th.consumerName || th.kitchenName || '').toLowerCase();
    const flat = (th.consumerFlat || '').toLowerCase();
    const society = (th.society || '').toLowerCase();
    return name.includes(q) || flat.includes(q) || society.includes(q);
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ImageBackground
        source={require('../../assets/doodle_bg.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.12 }}
        resizeMode="repeat"
      >
        <KeyboardAvoidingView
          style={[
            styles.flex,
            Platform.OS === 'android' && {
              // See the matching comment in (consumer)/chat.tsx — subtract
              // the safe-area bottom inset so it isn't double-counted
              // against Android's reported keyboard height.
              paddingBottom: Math.max(0, androidKeyboardHeight - insets.bottom),
            },
          ]}
          // See the matching comment in (consumer)/chat.tsx — Android is
          // driven by the manual androidKeyboardHeight listener above, not
          // by KeyboardAvoidingView's own Android behavior.
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* ── INBOX VIEW (When no active thread selected) ──────────────── */}
          {activeThread === null ? (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.inboxScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.headerWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <ScreenTitle
                    eyebrow={t('chat.chefInboxEyebrow', 'CHEF INBOX')}
                    title={t('chat.chefInboxTitle2', 'Customer Messages & Inquiries')}
                  />
                  <LanguageTogglePill />
                </View>
                <Text style={styles.headerSubtitle}>{t('chat.chefInboxSubtitle', 'Direct resident communication enabled')}</Text>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBarBox}>
                <Ionicons name="search-outline" size={18} color={Colors.muted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t('chat.searchResident', 'Search resident or flat number...')}
                  placeholderTextColor={Colors.muted}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={Colors.muted} />
                  </Pressable>
                )}
              </View>

              {/* Threads List */}
              <View style={styles.threadList}>
                {filteredThreads.length === 0 ? (
                  <View style={styles.emptyInboxBox}>
                    <Text style={styles.emptyInboxIcon}>💬</Text>
                    <Text style={styles.emptyInboxTitle}>{t('chat.noConversations', 'No conversations yet')}</Text>
                    <Text style={styles.emptyInboxSub}>
                      {t('chat.noConversationsSub', 'Customer inquiries and messages will appear here.')}
                    </Text>
                  </View>
                ) : (
                  filteredThreads.map((thread) => {
                    const residentName = thread.consumerName || thread.kitchenName || t('chat.resident', 'Resident');
                    const residentFlat = thread.consumerFlat ? `${thread.consumerFlat} · ` : '';
                    const societyLabel = thread.society || 'Lotus Heights';
                    const initials = getInitials(residentName);

                    return (
                      <Pressable
                        key={thread.id}
                        style={styles.threadCard}
                        onPress={() => {
                          setActiveThread(thread);
                          markThreadRead(thread.id, role);
                        }}
                      >
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>{initials}</Text>
                        </View>

                        <View style={styles.threadMain}>
                          <View style={styles.threadRowTop}>
                            <Text style={styles.threadName}>{residentName}</Text>
                            <Text style={styles.threadTime}>{formatTime(thread.lastActivity)}</Text>
                          </View>

                          <Text style={styles.threadMeta}>
                            {residentFlat}{societyLabel}
                          </Text>

                          <Text style={styles.threadPreview} numberOfLines={1}>
                            {thread.lastMessage || t('chat.tapToChatShort', 'Tap to chat')}
                          </Text>
                        </View>

                        {thread.unreadCount > 0 && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{thread.unreadCount}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })
                )}
              </View>
            </ScrollView>
          ) : (
            /* ── ACTIVE CONVERSATION VIEW ───────────────────────────────── */
            <View style={styles.flex}>
              {/* Top Navigation & Kitchen Switcher Bar */}
              <View style={styles.activeHeaderBar}>
                <Pressable
                  style={styles.backBtn}
                  onPress={() => {
                    setActiveThread(null);
                    loadThreads();
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color={Colors.dark} />
                  <Text style={styles.backBtnText}>{t('chat.allChats', 'All Chats')}</Text>
                </Pressable>

                {/* Switcher Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                  {threads.map((th) => {
                    const isSelected = th.id === activeThread.id;
                    const pillLabel = th.consumerName || th.kitchenName || t('chat.resident', 'Resident');
                    return (
                      <Pill
                        key={th.id}
                        label={pillLabel}
                        active={isSelected}
                        onPress={() => {
                          setActiveThread(th);
                          markThreadRead(th.id, role);
                        }}
                      />
                    );
                  })}
                </ScrollView>
              </View>

              {/* Active Resident Details Card */}
              <View style={styles.activeResidentCard}>
                <View style={styles.avatarCircleActive}>
                  <Text style={styles.avatarTextActive}>
                    {getInitials(activeThread.consumerName || activeThread.kitchenName || t('chat.resident', 'Resident'))}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.activeResidentName}>
                      {activeThread.consumerName || activeThread.kitchenName || t('chat.resident', 'Resident')}
                    </Text>
                  </View>
                  <Text style={styles.activeResidentSub}>
                    {activeThread.consumerFlat ? `${activeThread.consumerFlat} · ` : ''}{activeThread.society || 'Lotus Heights'}
                  </Text>
                </View>
              </View>

              {/* Chat Message Stream */}
              <ScrollView
                ref={scrollRef}
                style={styles.messageScroll}
                contentContainerStyle={styles.messageScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {messages.length === 0 ? (
                  <View style={styles.emptyChatState}>
                    <Text style={styles.emptyChatIcon}>👋</Text>
                    <Text style={styles.emptyChatTitle}>{t('chat.startConversation', 'Start the conversation')}</Text>
                    <Text style={styles.emptyChatSub}>
                      {t('chat.startConversationSub', { defaultValue: 'Send a message or order update to {{name}}.', name: activeThread.consumerName || t('chat.theResident', 'the resident') })}
                    </Text>
                  </View>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.from === role;
                    return (
                      <View
                        key={idx}
                        style={[styles.bubbleWrapper, isMe ? styles.bubbleRight : styles.bubbleLeft]}
                      >
                        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                          {m.mediaUrl && (
                            <Image source={{ uri: m.mediaUrl }} style={styles.chatImage} resizeMode="cover" />
                          )}
                          {m.text ? (
                            <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                              {m.text}
                            </Text>
                          ) : null}
                          <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther]}>
                            {formatTime(m.timestamp)}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}

                {/* Resident Typing Indicator */}
                {otherTyping && (
                  <View style={[styles.bubbleWrapper, styles.bubbleLeft]}>
                    <View style={[styles.bubble, styles.bubbleOther, styles.typingBubble]}>
                      <Text style={styles.typingText}>{t('chat.residentTyping', 'Resident is typing...')}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Quick Chef Replies Bar */}
              <View style={styles.quickRepliesSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRepliesRow}>
                  {CHEF_QUICK_REPLY_KEYS.map((qr, idx) => {
                    const replyText = t(qr.key, qr.fallback);
                    return (
                      <Pressable
                        key={idx}
                        style={styles.quickReplyChip}
                        onPress={() => handleSend(replyText)}
                      >
                        <Text style={styles.quickReplyText}>{replyText}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Message Send Bar */}
              <View style={styles.sendBar}>
                <Pressable style={styles.photoBtn} onPress={handlePickImage}>
                  <Ionicons name="camera-outline" size={22} color={Colors.primary} />
                </Pressable>

                <TextInput
                  style={styles.input}
                  value={draft}
                  onChangeText={handleDraftChange}
                  placeholder={t('chat.replyToResident', 'Reply to resident...')}
                  placeholderTextColor={Colors.muted}
                  multiline
                  maxLength={500}
                />

                <Pressable
                  style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
                  onPress={() => handleSend()}
                  disabled={!draft.trim() || sending}
                >
                  <Ionicons name="send" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (Colors: any, isDark: boolean) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    flex: { flex: 1 },
    inboxScroll: { paddingHorizontal: 16, paddingBottom: 40 },
    headerWrap: { paddingTop: 12 },
    headerSubtitle: {
      fontSize: 13,
      fontWeight: '600',
      color: Colors.muted,
      marginTop: -10,
      marginBottom: 8,
    },

    // Search Bar
    searchBarBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderWidth: 1.5,
      borderColor: Colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginVertical: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: Colors.dark,
    },

    // Thread List
    threadList: { gap: 10 },
    threadCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: Colors.border,
      padding: 14,
      gap: 12,
    },
    avatarCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? 'rgba(224,83,67,0.2)' : '#FEF2F2',
      borderWidth: 1.5,
      borderColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '900',
      color: Colors.primary,
    },
    threadMain: { flex: 1 },
    threadRowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    threadName: {
      fontSize: 16,
      fontWeight: '900',
      color: Colors.dark,
    },
    threadTime: {
      fontSize: 11,
      fontWeight: '700',
      color: Colors.muted,
    },
    threadMeta: {
      fontSize: 12,
      fontWeight: '700',
      color: Colors.muted,
      marginBottom: 3,
    },
    threadPreview: {
      fontSize: 13,
      color: Colors.dark,
      opacity: 0.85,
    },
    unreadBadge: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      minWidth: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    unreadBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '900',
    },

    // Empty Inbox State
    emptyInboxBox: {
      alignItems: 'center',
      paddingVertical: 50,
      gap: 8,
    },
    emptyInboxIcon: { fontSize: 42 },
    emptyInboxTitle: { fontSize: 17, fontWeight: '900', color: Colors.dark },
    emptyInboxSub: { fontSize: 13, color: Colors.muted, textAlign: 'center', maxWidth: 260 },

    // Active View Header & Switcher
    activeHeaderBar: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      backgroundColor: isDark ? 'rgba(31,26,21,0.9)' : 'rgba(255,253,248,0.9)',
      gap: 8,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
    },
    backBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: Colors.dark,
    },
    pillsRow: {
      gap: 8,
      paddingVertical: 2,
    },

    // Active Resident Header Card
    activeResidentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      gap: 12,
    },
    avatarCircleActive: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarTextActive: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
    },
    activeResidentName: {
      fontSize: 15,
      fontWeight: '900',
      color: Colors.dark,
    },
    activeResidentSub: {
      fontSize: 12,
      fontWeight: '700',
      color: Colors.muted,
      marginTop: 1,
    },
    // Messages Stream
    messageScroll: { flex: 1 },
    messageScrollContent: { padding: 16, gap: 10 },
    bubbleWrapper: { width: '100%', flexDirection: 'row' },
    bubbleLeft: { justifyContent: 'flex-start' },
    bubbleRight: { justifyContent: 'flex-end' },
    bubble: {
      maxWidth: '80%',
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 4,
    },
    bubbleMe: {
      backgroundColor: Colors.primary,
      borderBottomRightRadius: 4,
    },
    bubbleOther: {
      backgroundColor: Colors.surface,
      borderWidth: 1.5,
      borderColor: Colors.border,
      borderBottomLeftRadius: 4,
    },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    bubbleTextMe: { color: '#FFFFFF', fontWeight: '600' },
    bubbleTextOther: { color: Colors.dark, fontWeight: '600' },
    timeText: { fontSize: 10, alignSelf: 'flex-end', marginTop: 2 },
    timeTextMe: { color: 'rgba(255,255,255,0.75)' },
    timeTextOther: { color: Colors.muted },
    chatImage: {
      width: 200,
      height: 150,
      borderRadius: 12,
      marginBottom: 4,
    },
    typingBubble: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    typingText: {
      fontSize: 12,
      fontStyle: 'italic',
      color: Colors.muted,
    },
    emptyChatState: {
      alignItems: 'center',
      paddingVertical: 60,
      gap: 6,
    },
    emptyChatIcon: { fontSize: 36 },
    emptyChatTitle: { fontSize: 16, fontWeight: '900', color: Colors.dark },
    emptyChatSub: { fontSize: 12, color: Colors.muted, textAlign: 'center', maxWidth: 240 },

    // Quick Replies Section
    quickRepliesSection: {
      backgroundColor: Colors.bg,
      paddingVertical: 6,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    quickRepliesRow: {
      paddingHorizontal: 16,
      gap: 8,
    },
    quickReplyChip: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    quickReplyText: {
      fontSize: 12,
      fontWeight: '700',
      color: Colors.primary,
    },

    // Send Bar
    sendBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: Colors.surface,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      gap: 8,
    },
    photoBtn: {
      padding: 6,
    },
    input: {
      flex: 1,
      backgroundColor: Colors.bg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 14,
      paddingVertical: 8,
      fontSize: 14,
      color: Colors.dark,
      maxHeight: 100,
    },
    sendBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      opacity: 0.4,
    },
  });
