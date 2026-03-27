import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { MessageSquare, Plus, User } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/SearchBar';

export default function MessagesScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, users, conversations, getUnreadMessagesCount, hasPermission } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const canMessage = hasPermission('sendMessages') || hasPermission('receiveMessages');

  if (!canMessage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Messages',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <EmptyState
          icon={<MessageSquare size={48} color={colors.textMuted} />}
          title={t('noAccess')}
        />
      </View>
    );
  }

  const otherUsers = users.filter(u => u.id !== user?.id && u.role !== 'developer');

  const filteredUsers = otherUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Messages',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={t('search')}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {conversations.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Recent Conversations
              </Text>
              {conversations.map((conv) => {
                const unreadCount = getUnreadMessagesCount(conv.oderId);
                return (
                  <TouchableOpacity
                    key={conv.oderId}
                    onPress={() => router.push(`/messages/${conv.oderId}`)}
                    activeOpacity={0.7}
                  >
                    <Card style={styles.conversationCard}>
                      <View style={styles.conversationRow}>
                        <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                          <User size={20} color={colors.textMuted} />
                        </View>
                        <View style={styles.conversationContent}>
                          <View style={styles.conversationHeader}>
                            <Text style={[styles.userName, { color: colors.text }]}>
                              {conv.user?.name || 'Unknown'}
                            </Text>
                            <Text style={[styles.time, { color: colors.textMuted }]}>
                              {formatTime(conv.lastMessage.createdAt)}
                            </Text>
                          </View>
                          <View style={styles.messageRow}>
                            <Text
                              style={[
                                styles.lastMessage,
                                { color: colors.textSecondary },
                                unreadCount > 0 && { color: colors.text, fontWeight: '500' as const },
                              ]}
                              numberOfLines={1}
                            >
                              {conv.lastMessage.senderId === user?.id ? 'You: ' : ''}
                              {conv.lastMessage.content}
                            </Text>
                            {unreadCount > 0 && (
                              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.unreadText}>{unreadCount}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('employees')}
            </Text>
            {filteredUsers.length === 0 ? (
              <EmptyState
                icon={<User size={32} color={colors.textMuted} />}
                title={t('noEmployeesAvailable')}
              />
            ) : (
              filteredUsers.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => router.push(`/messages/${u.id}`)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.userCard}>
                    <View style={styles.userRow}>
                      <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                        <User size={20} color={colors.textMuted} />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.text }]}>
                          {u.name}
                        </Text>
                        <Text style={[styles.userRole, { color: colors.textSecondary }]}>
                          {u.role === 'manager' ? t('manager') : t('employee')}
                        </Text>
                      </View>
                      <View style={[styles.statusDot, { backgroundColor: u.isActive ? colors.status.completed : colors.textMuted }]} />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  conversationCard: {
    marginBottom: 8,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600' as const,
  },
  time: {
    fontSize: 12,
  },
  userCard: {
    marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  userRole: {
    fontSize: 13,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
