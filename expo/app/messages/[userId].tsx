import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Send, Camera, Paperclip, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';

export default function ChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, getUserById, getMessagesForUser, sendMessage, markMessageAsRead } = useAuth();
  const { addNotification } = useData();

  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const otherUser = getUserById(userId || '');
  const messages = getMessagesForUser(userId || '');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    messages.forEach(msg => {
      if (msg.receiverId === user?.id && !msg.read) {
        markMessageAsRead(msg.id);
      }
    });
  }, [messages, user?.id]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const handleSend = async () => {
    if (!messageText.trim() || !userId || !user) return;

    setIsSending(true);
    try {
      await sendMessage(userId, messageText.trim());
      
      await addNotification({
        title: 'New Message',
        message: `${user.name}: ${messageText.trim().substring(0, 50)}${messageText.length > 50 ? '...' : ''}`,
        type: 'message',
        relatedId: userId,
        senderId: user.id,
      });

      setMessageText('');
    } catch (error) {
      console.log('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const groupMessagesByDate = () => {
    const groups: { date: string; messages: typeof messages }[] = [];
    let currentDate = '';

    messages.forEach(msg => {
      const msgDate = formatDate(msg.createdAt);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: otherUser?.name || 'Chat',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messageGroups.map((group, groupIndex) => (
              <View key={groupIndex}>
                <View style={styles.dateContainer}>
                  <View style={[styles.dateBadge, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>
                      {group.date}
                    </Text>
                  </View>
                </View>

                {group.messages.map((msg) => {
                  const isOwnMessage = msg.senderId === user?.id;
                  return (
                    <View
                      key={msg.id}
                      style={[
                        styles.messageWrapper,
                        isOwnMessage ? styles.ownMessageWrapper : styles.otherMessageWrapper,
                      ]}
                    >
                      {!isOwnMessage && (
                        <View style={[styles.messageAvatar, { backgroundColor: colors.surface }]}>
                          <User size={14} color={colors.textMuted} />
                        </View>
                      )}
                      <View
                        style={[
                          styles.messageBubble,
                          isOwnMessage
                            ? [styles.ownMessage, { backgroundColor: colors.primary }]
                            : [styles.otherMessage, { backgroundColor: colors.surface }],
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            { color: isOwnMessage ? colors.primaryText : colors.text },
                          ]}
                        >
                          {msg.content}
                        </Text>
                        <Text
                          style={[
                            styles.messageTime,
                            { color: isOwnMessage ? colors.primaryText + '99' : colors.textMuted },
                          ]}
                        >
                          {formatTime(msg.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

            {messages.length === 0 && (
              <View style={styles.emptyChat}>
                <View style={[styles.emptyAvatar, { backgroundColor: colors.surface }]}>
                  <User size={32} color={colors.textMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {otherUser?.name}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Start a conversation
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.attachBtn, { backgroundColor: colors.surface }]}>
              <Camera size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Type a message..."
                placeholderTextColor={colors.textMuted}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={1000}
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!messageText.trim() || isSending}
              style={[
                styles.sendBtn,
                { backgroundColor: messageText.trim() ? colors.primary : colors.surface },
              ]}
            >
              <Send size={20} color={messageText.trim() ? colors.primaryText : colors.textMuted} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  ownMessageWrapper: {
    justifyContent: 'flex-end',
  },
  otherMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownMessage: {
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: 15,
    maxHeight: 80,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
