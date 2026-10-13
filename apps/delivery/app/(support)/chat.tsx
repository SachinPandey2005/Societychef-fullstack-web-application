import React, { useState } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Text } from '../../components/Typography';
import { IconButton } from '../../components/ui/IconButton';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';

interface Message {
  id: string;
  sender: 'partner' | 'support';
  text: string;
  timestamp: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { colors, spacing, radius, isDark } = useTheme();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'support',
      text: 'Hello Rajesh, how can we assist you with your delivery today?',
      timestamp: '12:00 PM',
    },
    {
      id: '2',
      sender: 'partner',
      text: 'I am at the gates of Prestige Lakeside, but the security guard is not letting my scooter in.',
      timestamp: '12:02 PM',
    },
    {
      id: '3',
      sender: 'support',
      text: 'Let me contact the society management immediately. Please hold on for a minute.',
      timestamp: '12:03 PM',
    },
  ]);
  const [typedText, setTypedText] = useState('');

  const handleSendMessage = () => {
    if (!typedText.trim()) return;

    const newMsg: Message = {
      id: Math.random().toString(),
      sender: 'partner',
      text: typedText,
      timestamp: 'Just Now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setTypedText('');

    // Simulate Agent auto reply
    setTimeout(() => {
      const replyMsg: Message = {
        id: Math.random().toString(),
        sender: 'support',
        text: 'The gate security has been updated. You can enter now. Please verify at gate.',
        timestamp: 'Just Now',
      };
      setMessages((prev) => [...prev, replyMsg]);
      showToast('New message from support agent', 'info');
    }, 1500);
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isPartner = item.sender === 'partner';
    return (
      <View
        style={[
          styles.messageRow,
          {
            justifyContent: isPartner ? 'flex-end' : 'flex-start',
            marginVertical: spacing.xs,
          },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isPartner ? colors.primary : colors.surface,
              borderTopLeftRadius: radius.medium,
              borderTopRightRadius: radius.medium,
              borderBottomLeftRadius: isPartner ? radius.medium : 0,
              borderBottomRightRadius: isPartner ? 0 : radius.medium,
              padding: spacing.sm + 2,
              maxWidth: '80%',
            },
          ]}
        >
          <Text variant="xs" color={isPartner ? 'white' : 'default'} style={styles.messageText}>
            {item.text}
          </Text>
          <Text
            variant="caption"
            color={isPartner ? 'white' : 'muted'}
            align={isPartner ? 'right' : 'left'}
            style={[styles.timestamp, { marginTop: 4, opacity: isPartner ? 0.8 : 1 }]}
          >
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper useKeyboardAvoiding={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        {/* Header Bar */}
        <View style={[styles.titleBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <IconButton name="arrow-back" onPress={() => router.back()} accessibilityLabel="Back button" />
          <View style={styles.metaContainer}>
            <Text variant="xs" weight="bold">
              Operations Chat Desk
            </Text>
            <Text variant="caption" color="success">
              Agent Connected
            </Text>
          </View>
          <IconButton name="phone" onPress={() => showToast('Calling agent...', 'info')} accessibilityLabel="Call agent" />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={[styles.listContainer, { padding: spacing.md }]}
        />

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, padding: spacing.sm }]}>
          <TextInput
            placeholder="Type message here..."
            placeholderTextColor={colors.textMuted}
            value={typedText}
            onChangeText={setTypedText}
            style={[
              styles.input,
              {
                color: colors.text,
                borderRadius: radius.pill,
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                paddingHorizontal: spacing.md,
              },
            ]}
            accessibilityRole="text"
            accessibilityLabel="Chat input field"
          />
          <IconButton
            name="send"
            onPress={handleSendMessage}
            size={22}
            color={colors.primary}
            accessibilityLabel="Send message button"
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
  },
  metaContainer: {
    flex: 1,
    marginLeft: 12,
  },
  listContainer: {
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  messageBubble: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  messageText: {
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 9,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1.5,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 14,
    fontFamily: 'System',
    marginRight: 8,
  },
});
