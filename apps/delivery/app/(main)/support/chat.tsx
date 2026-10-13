import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Icon } from '../../../components/Icon';
import { Button } from '../../../components/ui/Button';
import { useSupportStore } from '../../../store/useSupportStore';
import { SupportRepository } from '../../../repositories/SupportRepository';
import { useAuthStore } from '../../../store/useAuthStore';
import { supabase } from '../../../api/supabase';
import { useToast } from '../../../components/ui/Toast';

export default function SupportChatScreen() {
  const router = useRouter();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const { colors, spacing, radius } = useTheme();
  const { activeTicket, chatMessages, isLoading, isSending } = useSupportStore();
  const { userProfile } = useAuthStore();
  const { showToast } = useToast();

  const [inputMessage, setInputMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const currentUserId = userProfile?.id || '';

  // 1. Initial Load & Realtime Subscription
  useEffect(() => {
    if (!ticketId) return;

    // Load ticket detail & chat messages
    SupportRepository.fetchTicketDetails(ticketId);

    // Subscribe to realtime insertion events filtered by this ticket ID
    const channel = supabase
      .channel(`chat:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          // Avoid duplicate insertions for locally triggered messages
          const exists = useSupportStore.getState().chatMessages.some((m) => m.id === newMsg.id);
          if (!exists) {
            useSupportStore.getState().addChatMessage(newMsg);
            // Scroll to end
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  // 2. Scroll flat list to bottom on load
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [chatMessages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !ticketId) return;

    const currentMsg = inputMessage;
    setInputMessage('');

    try {
      await SupportRepository.sendChatMessage(ticketId, currentMsg);
    } catch (e: any) {
      showToast('Failed to send message. Please retry.', 'error');
      setInputMessage(currentMsg); // Restore text
    }
  };

  const handleAttachMedia = () => {
    showToast('Media attachment integration is planned for Phase 11.', 'info');
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text variant="sm" weight="extrabold" numberOfLines={1}>
            {activeTicket?.subject || 'Support Chat'}
          </Text>
          <Text variant="caption" style={{ fontSize: 9, color: colors.textMuted }}>
            Ticket Status: {activeTicket?.status || 'OPEN'}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Messages flat list */}
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, gap: 12 }}
          renderItem={({ item }) => {
            const isMe = item.sender_id === currentUserId;
            return (
              <View
                style={[
                  styles.msgContainer,
                  isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
                ]}
              >
                <View
                  style={[
                    styles.msgBubble,
                    {
                      borderRadius: radius.medium,
                      padding: spacing.md,
                      backgroundColor: isMe ? colors.primary : colors.surfaceElevated,
                    },
                    isMe
                      ? { borderBottomRightRadius: 2 }
                      : { borderBottomLeftRadius: 2 },
                  ]}
                >
                  <Text
                    variant="caption"
                    style={{ color: isMe ? '#FFFFFF' : colors.text, fontSize: 13 }}
                  >
                    {item.message}
                  </Text>
                </View>
                <Text
                  variant="caption"
                  style={{
                    fontSize: 8,
                    color: colors.textMuted,
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    marginTop: 2,
                  }}
                >
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />

        {/* Input Text Area */}
        <View style={[styles.inputBar, { padding: spacing.sm, borderTopColor: colors.outlineVariant }]}>
          <Pressable
            onPress={handleAttachMedia}
            style={[styles.attachBtn, { backgroundColor: colors.surfaceElevated, borderRadius: radius.medium }]}
          >
            <Icon name="attach-file" size={20} color={colors.textSecondary} />
          </Pressable>

          <TextInput
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Type your support query here..."
            placeholderTextColor={colors.textMuted}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.outlineVariant,
                borderRadius: radius.large,
                paddingHorizontal: spacing.md,
                color: colors.text,
              },
            ]}
          />

          <Pressable
            onPress={handleSendMessage}
            disabled={isSending || !inputMessage.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputMessage.trim() ? colors.primary : colors.surfaceElevated,
                borderRadius: radius.large,
              },
            ]}
          >
            <Icon name="send" size={18} color={inputMessage.trim() ? '#FFFFFF' : colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  msgContainer: {
    maxWidth: '80%',
  },
  msgBubble: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
  },
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    fontSize: 13,
  },
  sendBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
