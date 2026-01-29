import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import {
  User,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  FolderKanban,
  TrendingUp,
  MessageSquare,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { getUserById, hasPermission } = useAuth();
  const { projects } = useData();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const employee = getUserById(id || '');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const employeeStats = useMemo(() => {
    if (!employee) return null;

    const assignedProjects = projects.filter(p =>
      p.assignedEmployees.includes(employee.id)
    );

    const allTasks = projects.flatMap(p =>
      p.workflow.flatMap(s =>
        s.tasks.filter(t => t.assignedTo.includes(employee.id))
      )
    );

    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const pendingTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const pausedTasks = allTasks.filter(t => t.status === 'paused');

    const completionRate = allTasks.length > 0
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0;

    return {
      totalProjects: assignedProjects.length,
      activeProjects: assignedProjects.filter(p => p.status === 'in_progress').length,
      completedProjects: assignedProjects.filter(p => p.status === 'completed').length,
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      pausedTasks: pausedTasks.length,
      completionRate,
      recentTasks: allTasks.slice(-5).reverse(),
    };
  }, [employee, projects]);

  if (!employee) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: t('employees'),
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Employee not found
          </Text>
        </View>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getRoleLabel = () => {
    switch (employee.role) {
      case 'manager':
        return t('manager');
      case 'employee':
        return t('employee');
      default:
        return employee.role;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: employee.name,
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
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <User size={40} color={colors.primaryText} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.employeeName, { color: colors.text }]}>
                {employee.name}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: colors.status.completed + '20' }]}>
                <Text style={[styles.roleText, { color: colors.status.completed }]}>
                  {getRoleLabel()}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.infoSection, { borderTopColor: colors.borderLight }]}>
            <View style={styles.infoRow}>
              <Mail size={16} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {employee.email}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Calendar size={16} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Joined {formatDate(employee.createdAt)}
              </Text>
            </View>
          </View>

          {hasPermission('sendMessages') && (
            <Button
              title="Send Message"
              onPress={() => router.push(`/messages/${employee.id}`)}
              variant="outline"
              icon={<MessageSquare size={18} color={colors.text} />}
              style={styles.messageBtn}
            />
          )}
        </Card>

        {employeeStats && (
          <>
            <Card style={styles.statsCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('performance')}
              </Text>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                    Task Completion Rate
                  </Text>
                  <Text style={[styles.progressValue, { color: colors.text }]}>
                    {employeeStats.completionRate}%
                  </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.status.completed,
                        width: `${employeeStats.completionRate}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
                  <FolderKanban size={20} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {employeeStats.totalProjects}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {t('projects')}
                  </Text>
                </View>

                <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
                  <CheckCircle2 size={20} color={colors.status.completed} />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {employeeStats.completedTasks}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {t('completed')}
                  </Text>
                </View>

                <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
                  <Clock size={20} color={colors.status.paused} />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {employeeStats.pendingTasks}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {t('pending')}
                  </Text>
                </View>

                <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
                  <TrendingUp size={20} color={colors.status.inProgress} />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {employeeStats.activeProjects}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    Active
                  </Text>
                </View>
              </View>
            </Card>

            {employeeStats.recentTasks.length > 0 && (
              <Card style={styles.tasksCard}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Recent {t('tasks')}
                </Text>
                {employeeStats.recentTasks.map((task) => (
                  <View
                    key={task.id}
                    style={[styles.taskItem, { borderBottomColor: colors.borderLight }]}
                  >
                    <View style={[styles.taskNumber, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.taskNumberText, { color: colors.text }]}>
                        #{task.number}
                      </Text>
                    </View>
                    <Text
                      style={[styles.taskDescription, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {task.description}
                    </Text>
                    <StatusBadge status={task.status} size="small" showLabel={false} />
                  </View>
                ))}
              </Card>
            )}
          </>
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
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  infoSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
  },
  messageBtn: {
    marginTop: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
  },
  tasksCard: {
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  taskNumber: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskNumberText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  taskDescription: {
    flex: 1,
    fontSize: 14,
  },
  bottomPadding: {
    height: 24,
  },
});
