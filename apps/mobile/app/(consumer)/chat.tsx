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
import { useThemeStore } from '../../store/useThemeStore';
import { ScreenTitle } from '../../components/ui/ScreenTitle';
import { Pill } from '../../components/ui/Pill';
import type { Message } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import {
  getChatThreads,
  getChatMessages,
  sendMessage,
  isMockMode,
  subscribeToChat,
  sendTypingIndicator,
  markThreadRead,
} from '../../services';
import { apiClient } from '../../lib/apiClient';

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
  if (!name) return 'K';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function ConsumerChatScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const styles = getStyles(Colors, isDark);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Confirmed via a live device screenshot: the bottom tab bar
  // (Discover/Orders/Profile) stayed visible and mounted while on this
  // screen, even though it's reached via router.push() like a normal
  // pushed screen — because it's registered as a hidden Tabs.Screen inside
  // the SAME Tabs navigator, not a separate Stack screen. That fixed tab
  // bar permanently reserves space at the bottom that this screen's
  // KeyboardAvoidingView has no way to know about, so no behavior setting
  // could ever correctly position the input bar above the keyboard — the
  // real fix is hiding the tab bar itself while this screen is focused,
  // the standard React Navigation pattern for a tab-hosted screen that
  // needs the full screen (restored on blur so other tabs are unaffected).
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        parent?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation])
  );

  const params = useLocalSearchParams<{ kitchenId?: string; kitchenName?: string }>();
  const kitchenIdParam = params?.kitchenId;
  const kitchenNameParam = params?.kitchenName;

  const { user } = useAuthStore();
  const userId = user?.id || 'consumer-1';
  const role: 'consumer' | 'chef' = user?.activeRole === 'chef' ? 'chef' : 'consumer';

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

  // KeyboardAvoidingView's Android compensation (both `padding` and the
  // native `adjustResize` resize it falls back to) turned out to simply not
  // fire on this device — confirmed via live screenshots with neither
  // `padding` nor `undefined` producing any visible difference, the
  // signature of the known RN-Fabric-on-Android KeyboardAvoidingView bug.
  // Tracking keyboard height manually and applying it as padding sidesteps
  // KeyboardAvoidingView on Android entirely.
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

  // Load chat threads
  const loadThreads = async () => {
    try {
      const data = await getChatThreads(userId, role);
      let updatedThreads = [...data];

      if (kitchenIdParam) {
        const decodedName = kitchenNameParam ? decodeURIComponent(kitchenNameParam) : t('chat.homeChef', 'Home Chef');
        let targetThread = updatedThreads.find(
          (th) => th.kitchenId === kitchenIdParam || th.id === `thread_${kitchenIdParam}`
        );

        if (!targetThread) {
          targetThread = {
            id: `thread_${kitchenIdParam}`,
            kitchenId: kitchenIdParam,
            kitchenName: decodedName,
            society: 'Lotus Heights',
            lastMessage: t('chat.startedNewChat', 'Started a new chat'),
            lastActivity: new Date().toISOString(),
          };
          updatedThreads = [targetThread, ...updatedThreads];
        }

        setThreads(updatedThreads);
        setActiveThread(targetThread);
        return;
      }

      setThreads(updatedThreads);
    } catch (e) {
      console.warn('Failed to load chat threads:', e);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [userId, role, kitchenIdParam, kitchenNameParam]);

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

    const userMsg: Message = {
      from: role,
      text,
      timestamp: new Date().toISOString(),
      mediaUrl,
    };

    setMessages((prev) => [...prev, userMsg]);

    // Optimistically update thread inbox preview
    setThreads((prev) =>
      prev.map((th) =>
        th.id === activeThread.id
          ? { ...th, lastMessage: text || t('chat.sentPhoto', 'Sent photo'), lastActivity: userMsg.timestamp }
          : th
      )
    );

    try {
      await sendMessage(activeThread.id, text, role, mediaUrl);
      setSending(false);
    } catch (e) {
      console.warn('Failed to send message:', e);
      setSending(false);
    }
  }

  async function handlePickImage() {
    if (!activeThread?.id) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted' && Platform.OS !== 'web') {
        Alert.alert(t('chat.permissionNeeded', 'Permission needed'), t('chat.allowPhotoAccess', 'Allow photo library access to send photos.'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0]?.uri) return;

      const localUri = result.assets[0].uri;
      if (isMockMode) {
        handleSend(localUri);
        return;
      }

      let uploaded;
      try {
        uploaded = await apiClient.uploadFile('chat-media', activeThread.id, localUri);
      } catch (uploadErr) {
        console.warn('Chat image upload failed:', uploadErr);
        Alert.alert(t('chat.uploadFailed', 'Upload failed'), t('chat.uploadFailedBody', 'Could not send the photo. Please try again.'));
        return;
      }
      handleSend(uploaded.url);
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  }

  const filteredThreads = threads.filter((th) => {
    if (!searchQuery.trim()) return true;
    const name = th.kitchenName || th.consumerName || '';
    const msg = th.lastMessage || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activeKitchenName = activeThread?.kitchenName || t('chat.chef', 'Chef');
  const chefInitial = getInitials(activeKitchenName);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ImageBackground
        source={require('../../assets/doodle_bg.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.08 }}
        resizeMode="repeat"
      >
        <KeyboardAvoidingView
          style={[
            styles.flex,
            Platform.OS === 'android' && {
              // Android reports keyboardDidShow's height measured from the
              // absolute screen bottom, which already includes the gesture/
              // nav bar strip — the same strip SafeAreaView's bottom inset
              // reserves separately. Applying the full keyboard height on
              // top of that inset double-counted it, leaving a visible gap
              // above the keyboard (confirmed via a live screenshot: input
              // bar visible but floating well above the keyboard). Subtract
              // the inset so only the keyboard's own height is compensated.
              paddingBottom: Math.max(0, androidKeyboardHeight - insets.bottom),
            },
          ]}
          // iOS uses KeyboardAvoidingView's own `padding` behavior as
          // normal. On Android, neither `padding` nor `undefined` (relying
          // on native adjustResize) actually compensated at all here —
          // confirmed via live screenshots showing the input bar simply
          // absent either way, the known RN-Fabric KeyboardAvoidingView
          // bug on Android. Android is instead driven by the manual
          // androidKeyboardHeight listener above, applied directly as
          // paddingBottom here.
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* VIEW 1: INBOX THREADS LIST (When no active thread selected) */}
          {!activeThread ? (
            <View style={styles.flex}>
              {/* Header */}
              <View style={styles.inboxHeader}>
                <Pressable
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    alignSelf: 'flex-start',
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 20,
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    marginBottom: 12,
                  }}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={16} color={Colors.dark} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.dark }}>{t('chat.back', 'Back')}</Text>
                </Pressable>

                <ScreenTitle
                  eyebrow={t('chat.urgentChat', 'URGENT CHAT')}
                  title={t('chat.discussTiming', 'Discuss timing with your chef.')}
                />
                <Text style={styles.inboxSub}>
                  {t('chat.inboxSub', 'Select a kitchen box below to view or resume your private conversation.')}
                </Text>

                {/* Privacy Banner */}
                <View style={styles.privacyBanner}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={Colors.primary} />
                  <Text style={styles.privacyText}>
                    {t('chat.phonesMasked', 'Phone numbers are masked for privacy')}
                  </Text>
                </View>

                {/* Search Bar */}
                {threads.length > 2 && (
                  <View style={styles.searchRow}>
                    <Ionicons name="search" size={16} color={Colors.muted} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={t('chat.searchChats', 'Search kitchen chats...')}
                      placeholderTextColor={Colors.muted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                )}
              </View>

              {/* Kitchen Boxes / Threads List */}
              <ScrollView
                style={styles.inboxScroll}
                contentContainerStyle={styles.inboxListContainer}
                showsVerticalScrollIndicator={false}
              >
                {filteredThreads.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={48} color={Colors.muted} />
                    <Text style={styles.emptyTitle}>{t('chat.noChatsTitle', 'No kitchen chats yet')}</Text>
                    <Text style={styles.emptySub}>
                      {t('chat.noChatsSub', 'When you order from a kitchen or start a chat from Discover, your conversation box will appear here.')}
                    </Text>
                  </View>
                ) : (
                  filteredThreads.map((thread) => {
                    const initials = getInitials(thread.kitchenName || t('chat.kitchen', 'Kitchen'));
                    return (
                      <Pressable
                        key={thread.id}
                        style={({ pressed }) => [styles.kitchenBoxCard, pressed && styles.pressedCard]}
                        onPress={() => setActiveThread(thread)}
                      >
                        {/* Avatar */}
                        <View style={styles.kitchenAvatarCircle}>
                          <Text style={styles.kitchenAvatarText}>{initials}</Text>
                        </View>

                        {/* Info */}
                        <View style={styles.kitchenBoxDetails}>
                          <View style={styles.kitchenBoxTopRow}>
                            <Text style={styles.kitchenBoxName} numberOfLines={1}>
                              {thread.kitchenName || t('chat.kitchenChat', 'Kitchen Chat')}
                            </Text>
                            <Text style={styles.kitchenBoxTime}>
                              {formatTime(thread.lastActivity)}
                            </Text>
                          </View>

                          <View style={styles.kitchenBoxBottomRow}>
                            <Text style={styles.kitchenBoxLastMsg} numberOfLines={1}>
                              {thread.lastMessage || t('chat.tapToChat', 'Tap to chat with chef')}
                            </Text>
                            {thread.unreadCount > 0 && (
                              <View style={styles.unreadBadge}>
                                <Text style={styles.unreadBadgeText}>{thread.unreadCount}</Text>
                              </View>
                            )}
                          </View>

                          {thread.society && (
                            <View style={styles.societyTagRow}>
                              <Ionicons name="location-outline" size={11} color={Colors.muted} />
                              <Text style={styles.societyTagText}>{thread.society}</Text>
                            </View>
                          )}
                        </View>

                        <Ionicons name="chevron-forward" size={18} color={Colors.muted} style={{ marginLeft: 4 }} />
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          ) : (
            /* VIEW 2: ACTIVE CONVERSATION VIEW */
            <View style={styles.flex}>
              {/* Active Conversation Top Bar */}
              <View style={styles.chatTopBar}>
                {/* Back to All Chats Button */}
                <Pressable
                  style={styles.backBtn}
                  onPress={() => setActiveThread(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Back to all chats"
                >
                  <Ionicons name="chevron-back" size={20} color={Colors.primary} />
                  <Text style={styles.backBtnText}>{t('chat.allChats', 'All Chats')}</Text>
                </Pressable>

                {/* Active Kitchen Info Header */}
                <Pressable
                  style={styles.chatHeaderInfo}
                  onPress={() => {
                    if (activeThread.kitchenId) {
                      router.push(`/(consumer)/kitchen/${activeThread.kitchenId}` as any);
                    }
                  }}
                >
                  <View style={styles.chatHeaderAvatar}>
                    <Text style={styles.chatHeaderAvatarText}>{chefInitial}</Text>
                  </View>
                  <View>
                    <Text style={styles.chatHeaderName} numberOfLines={1}>
                      {activeKitchenName}
                    </Text>
                  </View>
                </Pressable>

                {/* View Kitchen Profile Button */}
                {activeThread.kitchenId && (
                  <Pressable
                    style={styles.kitchenProfileBtn}
                    onPress={() => router.push(`/(consumer)/kitchen/${activeThread.kitchenId}` as any)}
                  >
                    <Ionicons name="restaurant-outline" size={18} color={Colors.primary} />
                  </Pressable>
                )}
              </View>

              {/* Horizontal Kitchen Switcher Tabs */}
              {threads.length > 1 && (
                <View style={styles.tabsStrip}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsStripScroll}
                  >
                    {threads.map((th) => (
                      <Pill
                        key={th.id}
                        label={th.kitchenName}
                        active={activeThread?.id === th.id}
                        onPress={() => setActiveThread(th)}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Privacy Banner */}
              <View style={styles.privacyBannerCompact}>
                <Ionicons name="shield-checkmark-outline" size={12} color={Colors.blue} />
                <Text style={styles.privacyTextCompact}>
                  {t('chat.phonesMasked', 'Phone numbers are masked for privacy')}
                </Text>
              </View>

              {/* Messages Scroll Area */}
              <ScrollView
                ref={scrollRef}
                style={styles.messageScroll}
                contentContainerStyle={styles.messageContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
              >
                {messages.map((msg, idx) => {
                  const isConsumer = msg.from === 'consumer';
                  const isMine = msg.from === role;
                  const isRead = isMine && !!lastReadByOther && msg.timestamp <= lastReadByOther;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.bubbleRow,
                        isConsumer ? styles.bubbleRowRight : styles.bubbleRowLeft,
                      ]}
                    >
                      {!isConsumer && (
                        <View style={styles.avatarChef}>
                          <Text style={styles.avatarChefText}>{chefInitial}</Text>
                        </View>
                      )}
                      <View style={styles.bubbleWrapper}>
                        <View
                          style={[
                            styles.bubble,
                            isConsumer ? styles.bubbleConsumer : styles.bubbleChef,
                          ]}
                        >
                          {msg.mediaUrl && (
                            <Image
                              source={{ uri: msg.mediaUrl }}
                              style={styles.bubbleImage}
                              resizeMode="cover"
                            />
                          )}
                          {msg.text ? (
                            <Text
                              style={[
                                styles.bubbleText,
                                isConsumer ? styles.bubbleTextConsumer : styles.bubbleTextChef,
                              ]}
                            >
                              {msg.text}
                            </Text>
                          ) : null}
                        </View>
                        <View
                          style={[
                            styles.timestampRow,
                            isConsumer ? styles.timestampRowRight : styles.timestampRowLeft,
                          ]}
                        >
                          <Text style={styles.timestamp}>{formatTime(msg.timestamp)}</Text>
                          {isMine && (
                            <Ionicons
                              name={isRead ? 'checkmark-done' : 'checkmark'}
                              size={13}
                              color={isRead ? Colors.primary : Colors.muted}
                              style={styles.readTick}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
                {otherTyping && (
                  <View style={[styles.bubbleRow, styles.bubbleRowLeft]}>
                    <View style={styles.avatarChef}>
                      <Text style={styles.avatarChefText}>{chefInitial}</Text>
                    </View>
                    <View style={styles.bubbleWrapper}>
                      <View style={[styles.bubble, styles.bubbleChef]}>
                        <Text style={styles.typingDots}>{t('chat.chefTyping', '••• Chef is typing...')}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Bottom Message Input Bar */}
              <View style={styles.inputBar}>
                <Pressable style={styles.attachButton} onPress={handlePickImage}>
                  <Ionicons name="image-outline" size={20} color={Colors.muted} />
                </Pressable>
                <TextInput
                  style={styles.inputField}
                  placeholder={t('chat.typeMessageTo', { defaultValue: 'Type a message to {{name}}...', name: activeKitchenName })}
                  placeholderTextColor={Colors.muted}
                  value={draft}
                  onChangeText={handleDraftChange}
                  onBlur={stopTyping}
                  multiline
                  maxLength={500}
                  returnKeyType="default"
                  {...({ outlineStyle: 'none' } as any)}
                />
                <Pressable
                  style={[
                    styles.sendButton,
                    (!draft.trim() && !sending) && styles.sendButtonDisabled,
                  ]}
                  onPress={() => handleSend()}
                  disabled={!draft.trim() || sending}
                >
                  <Ionicons name="send" size={16} color="#FFF" />
                </Pressable>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any, isDark: boolean) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    flex: {
      flex: 1,
    },

    // INBOX VIEW STYLES
    inboxHeader: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 10,
    },
    inboxSub: {
      fontSize: 13,
      color: Colors.muted,
      marginTop: 4,
      lineHeight: 18,
    },
    privacyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      marginTop: 10,
    },
    privacyText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#4ADE80' : '#15803D',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginTop: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: Colors.dark,
    },
    inboxScroll: {
      flex: 1,
    },
    inboxListContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
    },
    kitchenBoxCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
        android: { elevation: 2 },
      }),
    },
    pressedCard: {
      opacity: 0.8,
    },
    kitchenAvatarCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    kitchenAvatarText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    kitchenBoxDetails: {
      flex: 1,
    },
    kitchenBoxTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3,
    },
    kitchenBoxName: {
      fontSize: 15,
      fontWeight: '800',
      color: Colors.dark,
      flex: 1,
      marginRight: 8,
    },
    kitchenBoxTime: {
      fontSize: 11,
      color: Colors.muted,
      fontWeight: '600',
    },
    kitchenBoxBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    kitchenBoxLastMsg: {
      fontSize: 13,
      color: Colors.muted,
      flex: 1,
      marginRight: 8,
    },
    unreadBadge: {
      backgroundColor: Colors.primary,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      minWidth: 18,
      alignItems: 'center',
    },
    unreadBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
    societyTagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 4,
    },
    societyTagText: {
      fontSize: 11,
      color: Colors.muted,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 30,
      gap: 10,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: Colors.dark,
    },
    emptySub: {
      fontSize: 13,
      color: Colors.muted,
      textAlign: 'center',
      lineHeight: 18,
    },

    // ACTIVE CHAT VIEW STYLES
    chatTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderColor: Colors.border,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingRight: 8,
    },
    backBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: Colors.primary,
    },
    chatHeaderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 8,
      gap: 10,
    },
    chatHeaderAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatHeaderAvatarText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    chatHeaderName: {
      fontSize: 15,
      fontWeight: '800',
      color: Colors.dark,
    },
    kitchenProfileBtn: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFF3E0',
    },
    tabsStrip: {
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderColor: Colors.border,
      paddingVertical: 6,
    },
    tabsStripScroll: {
      paddingHorizontal: 16,
      gap: 8,
    },
    privacyBannerCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
      paddingVertical: 4,
    },
    privacyTextCompact: {
      fontSize: 11,
      color: Colors.blue,
      fontWeight: '600',
    },

    // MESSAGES STYLES
    messageScroll: {
      flex: 1,
    },
    messageContent: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    bubbleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 4,
    },
    bubbleRowRight: {
      justifyContent: 'flex-end',
    },
    bubbleRowLeft: {
      justifyContent: 'flex-start',
    },
    avatarChef: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 6,
      marginBottom: 14,
    },
    avatarChefText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
    bubbleWrapper: {
      maxWidth: '78%',
    },
    bubble: {
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    bubbleConsumer: {
      backgroundColor: Colors.primary,
      borderBottomRightRadius: 4,
    },
    bubbleChef: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderBottomLeftRadius: 4,
    },
    bubbleText: {
      fontSize: 14,
      lineHeight: 20,
    },
    bubbleTextConsumer: {
      color: '#FFFFFF',
    },
    bubbleTextChef: {
      color: Colors.dark,
    },
    bubbleImage: {
      width: 200,
      height: 150,
      borderRadius: 12,
      marginBottom: 6,
    },
    timestampRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    timestampRowRight: {
      justifyContent: 'flex-end',
    },
    timestampRowLeft: {
      justifyContent: 'flex-start',
    },
    timestamp: {
      fontSize: 10,
      color: Colors.muted,
    },
    readTick: {
      marginLeft: 2,
    },
    typingDots: {
      color: Colors.muted,
      fontSize: 12,
      fontStyle: 'italic',
    },

    // INPUT BAR STYLES
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: Colors.surface,
      borderTopWidth: 1,
      borderColor: Colors.border,
      gap: 8,
    },
    attachButton: {
      padding: 8,
    },
    inputField: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      fontSize: 14,
      color: Colors.dark,
      maxHeight: 100,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
  });
