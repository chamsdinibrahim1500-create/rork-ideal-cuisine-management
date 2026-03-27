import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  MapPin,
  Users,
  Calendar,
  Play,
  Pause,
  CheckCircle2,
  Plus,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Edit2,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { PermissionGate } from '@/components/PermissionGate';
import { colors as colorConstants } from '@/constants/colors';
import { ProjectStatus, TaskStatus } from '@/types';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { hasPermission, employees } = useAuth();
  const { getProjectById, updateProject, deleteProject, updateTask, addNotification } = useData();

  const project = getProjectById(id || '');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [expandedStages, setExpandedStages] = useState<string[]>([]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (project) {
      setExpandedStages(project.workflow.map(s => s.id));
    }
  }, [project]);

  if (!project) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Project not found
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  const toggleStage = (stageId: string) => {
    setExpandedStages(prev =>
      prev.includes(stageId)
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    updateProject(project.id, { status: newStatus });
  };

  const handleTaskStatusChange = (stageId: string, taskId: string, newStatus: TaskStatus) => {
    if (!hasPermission('editTasks')) {
      console.log('No permission to edit tasks');
      return;
    }
    updateTask(project.id, stageId, taskId, { status: newStatus });
  };

  const handleLaunchProject = async () => {
    await updateProject(project.id, { status: 'in_progress' });
    await addNotification({
      title: t('launchProject'),
      message: `${project.name} ${t('inProgress')}`,
      type: 'project',
      relatedId: project.id,
    });
    Alert.alert(t('success'), t('launchProject'));
  };

  const handleDeleteProject = () => {
    Alert.alert(
      t('delete'),
      t('confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteProject(project.id);
            router.back();
          },
        },
      ]
    );
  };

  const openMaps = () => {
    const { latitude, longitude } = project.location;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
    Linking.openURL(url);
  };

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'in_progress':
        return <Play size={16} color="#FFFFFF" />;
      case 'paused':
        return <Pause size={16} color="#FFFFFF" />;
      case 'completed':
        return <CheckCircle2 size={16} color="#FFFFFF" />;
    }
  };

  const assignedEmployeeNames = project.assignedEmployees
    .map(empId => employees.find(e => e.id === empId)?.name || empId)
    .join(', ');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <PermissionGate permission="deleteProjects">
              <TouchableOpacity onPress={handleDeleteProject} style={styles.headerBtn}>
                <Trash2 size={20} color={colors.status.inProgress} />
              </TouchableOpacity>
            </PermissionGate>
          ),
        }}
      />

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={[styles.projectName, { color: colors.text }]}>
            {project.name}
          </Text>
          <Text style={[styles.projectNumber, { color: colors.textSecondary }]}>
            {project.number}
          </Text>
          <StatusBadge status={project.status} size="medium" />
        </View>

        <View style={styles.infoSection}>
          <Card style={styles.infoCard}>
            <TouchableOpacity onPress={openMaps} style={styles.infoRow}>
              <MapPin size={20} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={2}>
                {project.location.address}
              </Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>

          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Calendar size={20} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {new Date(project.startDate).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </Card>

          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Users size={20} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={2}>
                {assignedEmployeeNames || '-'}
              </Text>
            </View>
          </Card>
        </View>

        <PermissionGate permission="editProjects">
          <View style={styles.statusButtons}>
            {(['in_progress', 'paused', 'completed'] as ProjectStatus[]).map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => handleStatusChange(status)}
                style={[
                  styles.statusBtn,
                  {
                    backgroundColor:
                      status === 'in_progress'
                        ? colorConstants.status.inProgress
                        : status === 'paused'
                        ? colorConstants.status.paused
                        : colorConstants.status.completed,
                    opacity: project.status === status ? 1 : 0.5,
                  },
                ]}
              >
                {getStatusIcon(status)}
              </TouchableOpacity>
            ))}
          </View>
        </PermissionGate>

        <View style={styles.workflowSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('workflow')}
            </Text>
            <PermissionGate permission="editWorkflow">
              <TouchableOpacity
                onPress={() => router.push(`/project/${project.id}/workflow`)}
                style={[styles.editBtn, { backgroundColor: colors.surface }]}
              >
                <Edit2 size={16} color={colors.text} />
              </TouchableOpacity>
            </PermissionGate>
          </View>

          {project.workflow.length === 0 ? (
            <Card style={styles.emptyWorkflow}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {t('noTasks')}
              </Text>
              <PermissionGate permission="editWorkflow">
                <Button
                  title={t('addStage')}
                  onPress={() => router.push(`/project/${project.id}/workflow`)}
                  variant="outline"
                  size="small"
                  style={{ marginTop: 12 }}
                />
              </PermissionGate>
            </Card>
          ) : (
            project.workflow.map((stage, stageIndex) => (
              <View key={stage.id}>
                <Card style={styles.stageCard}>
                  <TouchableOpacity
                    onPress={() => toggleStage(stage.id)}
                    style={styles.stageHeader}
                  >
                    <View style={[styles.stageNumber, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.stageNumberText, { color: colors.primaryText }]}>
                        {stageIndex + 1}
                      </Text>
                    </View>
                    <Text style={[styles.stageName, { color: colors.text }]}>
                      {stage.name}
                    </Text>
                    <View style={styles.stageRight}>
                      <Text style={[styles.taskCount, { color: colors.textMuted }]}>
                        {stage.tasks.length} {t('tasks')}
                      </Text>
                      {expandedStages.includes(stage.id) ? (
                        <ChevronDown size={20} color={colors.textMuted} />
                      ) : (
                        <ChevronRight size={20} color={colors.textMuted} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {expandedStages.includes(stage.id) && stage.tasks.length > 0 && (
                    <View style={[styles.tasksList, { borderTopColor: colors.borderLight }]}>
                      {stage.tasks.map((task) => (
                        <View
                          key={task.id}
                          style={[styles.taskRow, { borderBottomColor: colors.borderLight }]}
                        >
                          <View
                            style={[
                              styles.taskNumber,
                              { backgroundColor: colors.surface },
                            ]}
                          >
                            <Text style={[styles.taskNumberText, { color: colors.text }]}>
                              {task.number}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.taskDescription,
                              { color: colors.text },
                              task.status === 'completed' && styles.taskCompleted,
                            ]}
                            numberOfLines={2}
                          >
                            {task.description}
                          </Text>
                          <View style={styles.taskActions}>
                            {hasPermission('editTasks') && (
                              <TouchableOpacity
                                onPress={() =>
                                  handleTaskStatusChange(
                                    stage.id,
                                    task.id,
                                    task.status === 'paused' ? 'in_progress' : 'paused'
                                  )
                                }
                                style={[
                                  styles.taskActionBtn,
                                  {
                                    backgroundColor:
                                      task.status === 'paused'
                                        ? colorConstants.status.pausedBg
                                        : colors.surface,
                                  },
                                ]}
                              >
                                <Pause
                                  size={14}
                                  color={
                                    task.status === 'paused'
                                      ? colorConstants.status.paused
                                      : colors.textMuted
                                  }
                                />
                              </TouchableOpacity>
                            )}
                            {hasPermission('editTasks') && (
                              <TouchableOpacity
                                onPress={() =>
                                  handleTaskStatusChange(
                                    stage.id,
                                    task.id,
                                    task.status === 'completed' ? 'pending' : 'completed'
                                  )
                                }
                                style={[
                                  styles.taskActionBtn,
                                  {
                                    backgroundColor:
                                      task.status === 'completed'
                                        ? colorConstants.status.completedBg
                                        : colors.surface,
                                  },
                                ]}
                              >
                                <CheckCircle2
                                  size={14}
                                  color={
                                    task.status === 'completed'
                                      ? colorConstants.status.completed
                                      : colors.textMuted
                                  }
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>

                {stageIndex < project.workflow.length - 1 && (
                  <View style={styles.arrowContainer}>
                    <View style={[styles.arrowLine, { backgroundColor: colors.border }]} />
                    <ChevronDown size={20} color={colors.border} />
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <PermissionGate permission="editProjects">
          {project.status !== 'in_progress' && (
            <Button
              title={t('launchProject')}
              onPress={handleLaunchProject}
              size="large"
              icon={<Play size={20} color={colors.primaryText} />}
              style={styles.launchButton}
            />
          )}
        </PermissionGate>

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerBtn: {
    padding: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  titleSection: {
    marginBottom: 20,
  },
  projectName: {
    fontSize: 26,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  projectNumber: {
    fontSize: 14,
    marginBottom: 12,
  },
  infoSection: {
    gap: 8,
    marginBottom: 20,
  },
  infoCard: {
    padding: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  statusBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workflowSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWorkflow: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
  },
  stageCard: {
    padding: 0,
    overflow: 'hidden',
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  stageNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumberText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  stageName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  stageRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskCount: {
    fontSize: 12,
  },
  tasksList: {
    borderTopWidth: 1,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  taskNumber: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskNumberText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  taskDescription: {
    flex: 1,
    fontSize: 14,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  taskActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  arrowLine: {
    width: 2,
    height: 12,
  },
  launchButton: {
    marginTop: 8,
  },
  bottomPadding: {
    height: 32,
  },
});
