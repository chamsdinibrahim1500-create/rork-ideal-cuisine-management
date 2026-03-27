import React, { useRef, useEffect } from 'react';
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
import { Bell, CheckCheck, Trash2, FileText, FolderKanban, MessageSquare, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { notifications, markNotificationRead, clearAllNotifications } = useData();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = React.useState(false);

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

  const handleNotificationPress = (notification: any) => {
    markNotificationRead(notification.id);
    
    if (notification.type === 'task' && notification.relatedId) {
      router.push(`/task/${notification.relatedId}`);
    } else if (notification.type === 'project' && notification.relatedId) {
      router.push(`/project/${notification.relatedId}`);
    }
  };

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) {
        markNotificationRead(n.id);
      }
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <FileText size={20} color={colors.status.paused} />;
      case 'project':
        return <FolderKanban size={20} color={colors.status.completed} />;
      case 'file':
        return <FileText size={20} color={colors.primary} />;
      case 'message':
        return <MessageSquare size={20} color={colors.status.inProgress} />;
      case 'report':
        return <FileText size={20} color={colors.status.completed} />;
      default:
        return <AlertCircle size={20} color={colors.textMuted} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('fr-FR');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t('notifications'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerBtn}>
              <CheckCheck size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : null,
        }}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell size={48} color={colors.textMuted} />}
              title={t('noItems')}
            />
          ) : (
            <>
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.7}
                >
                  <Card
                    style={[
                      styles.notificationCard,
                      !notification.read ? {
                        borderLeftWidth: 3,
                        borderLeftColor: colors.primary,
                      } : undefined,
                    ]}
                  >
                    <View style={styles.notificationRow}>
                      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                        {getNotificationIcon(notification.type)}
                      </View>
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <Text
                            style={[
                              styles.notificationTitle,
                              { color: colors.text },
                              !notification.read && styles.unreadTitle,
                            ]}
                          >
                            {notification.title}
                          </Text>
                          <Text style={[styles.notificationTime, { color: colors.textMuted }]}>
                            {formatTime(notification.createdAt)}
                          </Text>
                        </View>
                        <Text
                          style={[styles.notificationMessage, { color: colors.textSecondary }]}
                          numberOfLines={2}
                        >
                          {notification.message}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}

              {notifications.length > 0 && (
                <Button
                  title="Clear All"
                  onPress={clearAllNotifications}
                  variant="outline"
                  size="medium"
                  icon={<Trash2 size={16} color={colors.text} />}
                  style={styles.clearBtn}
                />
              )}
            </>
          )}
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
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  headerBtn: {
    padding: 8,
  },
  notificationCard: {
    marginBottom: 12,
  },
  notificationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '600' as const,
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  clearBtn: {
    marginTop: 8,
  },
});
