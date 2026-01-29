import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import {
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Send,
  Camera,
  FileText,
  User,
  Calendar,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { PermissionGate } from '@/components/PermissionGate';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, getUserById } = useAuth();
  const { getTaskById, updateTask, addTaskReport, addNotification } = useData();

  const [reportText, setReportText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const taskData = getTaskById(id || '');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!taskData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: t('tasks'),
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Task not found
          </Text>
        </View>
      </View>
    );
  }

  const { task, project, stage } = taskData;

  const handleStatusChange = async (newStatus: 'pending' | 'in_progress' | 'paused' | 'completed') => {
    await updateTask(project.id, stage.id, task.id, { status: newStatus });
  };

  const handleSubmitReport = async () => {
    if (!reportText.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addTaskReport(project.id, stage.id, task.id, {
        userId: user.id,
        userName: user.name,
        content: reportText.trim(),
        attachments: [],
      });

      await addNotification({
        title: t('report'),
        message: `${user.name} submitted a report for "${task.description}"`,
        type: 'report',
        relatedId: task.id,
        senderId: user.id,
      });

      setReportText('');
      Alert.alert(t('success'), 'Report submitted successfully');
    } catch (error) {
      console.log('Error submitting report:', error);
      Alert.alert(t('error'), 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAssigneeNames = () => {
    return task.assignedTo.map(id => {
      const assignee = getUserById(id);
      return assignee?.name || 'Unknown';
    }).join(', ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: `${t('tasks')} #${task.number}`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.mainCard}>
          <View style={styles.taskHeader}>
            <View style={[styles.taskNumber, { backgroundColor: colors.primary }]}>
              <Text style={[styles.taskNumberText, { color: colors.primaryText }]}>
                #{task.number}
              </Text>
            </View>
            <StatusBadge status={task.status} size="medium" />
          </View>

          <Text style={[styles.taskDescription, { color: colors.text }]}>
            {task.description}
          </Text>

          <View style={[styles.infoSection, { borderTopColor: colors.borderLight }]}>
            <View style={styles.infoRow}>
              <FileText size={16} color={colors.textMuted} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('projects')}:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {project.name}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <User size={16} color={colors.textMuted} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('assignTo')}:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {getAssigneeNames() || 'Unassigned'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Calendar size={16} color={colors.textMuted} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('startDate')}:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(task.createdAt)}
              </Text>
            </View>
          </View>
        </Card>

        <PermissionGate permission="editTasks">
          <Card style={styles.statusCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('filter')}
            </Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                onPress={() => handleStatusChange('pending')}
                style={[
                  styles.statusBtn,
                  { backgroundColor: task.status === 'pending' ? colors.status.paused + '30' : colors.surface },
                ]}
              >
                <Clock size={18} color={colors.status.paused} />
                <Text style={[styles.statusBtnText, { color: colors.status.paused }]}>
                  {t('pending')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStatusChange('in_progress')}
                style={[
                  styles.statusBtn,
                  { backgroundColor: task.status === 'in_progress' ? colors.status.inProgress + '30' : colors.surface },
                ]}
              >
                <Play size={18} color={colors.status.inProgress} />
                <Text style={[styles.statusBtnText, { color: colors.status.inProgress }]}>
                  {t('inProgress')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStatusChange('paused')}
                style={[
                  styles.statusBtn,
                  { backgroundColor: task.status === 'paused' ? colors.status.paused + '30' : colors.surface },
                ]}
              >
                <Pause size={18} color={colors.status.paused} />
                <Text style={[styles.statusBtnText, { color: colors.status.paused }]}>
                  {t('paused')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStatusChange('completed')}
                style={[
                  styles.statusBtn,
                  { backgroundColor: task.status === 'completed' ? colors.status.completed + '30' : colors.surface },
                ]}
              >
                <CheckCircle2 size={18} color={colors.status.completed} />
                <Text style={[styles.statusBtnText, { color: colors.status.completed }]}>
                  {t('completed')}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </PermissionGate>

        <PermissionGate permission="createReports">
          <Card style={styles.reportCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('sendReport')}
            </Text>
            <View style={[styles.reportInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.reportInput, { color: colors.text }]}
                placeholder={t('report')}
                placeholderTextColor={colors.textMuted}
                value={reportText}
                onChangeText={setReportText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.reportActions}>
              <TouchableOpacity style={[styles.reportActionBtn, { backgroundColor: colors.surface }]}>
                <Camera size={20} color={colors.text} />
              </TouchableOpacity>
              <Button
                title={t('sendReport')}
                onPress={handleSubmitReport}
                loading={isSubmitting}
                disabled={!reportText.trim()}
                icon={<Send size={16} color={colors.primaryText} />}
                style={styles.sendBtn}
              />
            </View>
          </Card>
        </PermissionGate>

        {task.reports && task.reports.length > 0 && (
          <Card style={styles.reportsListCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('report')} ({task.reports.length})
            </Text>
            {task.reports.map((report) => (
              <View
                key={report.id}
                style={[styles.reportItem, { borderBottomColor: colors.borderLight }]}
              >
                <View style={styles.reportHeader}>
                  <View style={[styles.reportAvatar, { backgroundColor: colors.surface }]}>
                    <User size={14} color={colors.textMuted} />
                  </View>
                  <View style={styles.reportMeta}>
                    <Text style={[styles.reportAuthor, { color: colors.text }]}>
                      {report.userName}
                    </Text>
                    <Text style={[styles.reportDate, { color: colors.textMuted }]}>
                      {formatDate(report.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.reportContent, { color: colors.textSecondary }]}>
                  {report.content}
                </Text>
              </View>
            ))}
          </Card>
        )}

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  mainCard: {
    marginBottom: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskNumber: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  taskNumberText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  taskDescription: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
    marginBottom: 16,
  },
  infoSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    flex: 1,
  },
  statusCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  reportCard: {
    marginBottom: 16,
  },
  reportInputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  reportInput: {
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
  reportActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    flex: 1,
  },
  reportsListCard: {
    marginBottom: 16,
  },
  reportItem: {
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  reportAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportMeta: {
    flex: 1,
  },
  reportAuthor: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  reportDate: {
    fontSize: 12,
    marginTop: 2,
  },
  reportContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 24,
  },
});
