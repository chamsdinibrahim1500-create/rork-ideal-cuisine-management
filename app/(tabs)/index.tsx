import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Users,
  AlertTriangle,
  Bell,
  ChevronRight,
  Play,
  User,
  MessageSquare,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { PermissionGate } from '@/components/PermissionGate';

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { user, users, hasPermission } = useAuth();
  const { projects, dashboardStats, unreadNotifications } = useData();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const recentProjects = projects.slice(0, 3);
  const employees = users.filter(u => u.role !== 'developer');

  const employeeStats = useMemo(() => {
    return employees.map(emp => {
      const assignedTasks = projects.flatMap(p =>
        p.workflow.flatMap(s =>
          s.tasks.filter(t => t.assignedTo.includes(emp.id))
        )
      );
      const completedTasks = assignedTasks.filter(t => t.status === 'completed');
      const pendingTasks = assignedTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

      return {
        ...emp,
        totalTasks: assignedTasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        completionRate: assignedTasks.length > 0
          ? Math.round((completedTasks.length / assignedTasks.length) * 100)
          : 0,
      };
    });
  }, [employees, projects]);

  const StatCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
  }) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {t('welcome')},
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.name || 'User'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {hasPermission('sendMessages') && (
                <TouchableOpacity
                  onPress={() => router.push('/messages')}
                  style={[styles.headerBtn, { backgroundColor: colors.surface }]}
                >
                  <MessageSquare size={20} color={colors.text} />
                </TouchableOpacity>
              )}
              {hasPermission('viewNotifications') && (
                <TouchableOpacity
                  onPress={() => router.push('/notifications')}
                  style={[styles.headerBtn, { backgroundColor: colors.surface }]}
                >
                  <Bell size={20} color={colors.text} />
                  {unreadNotifications > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.status.inProgress }]}>
                      <Text style={styles.badgeText}>{unreadNotifications}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <PermissionGate permission="viewDashboard">
              <View style={styles.statsGrid}>
                <StatCard
                  icon={<FolderKanban size={20} color={colors.primary} />}
                  label={t('totalProjects')}
                  value={dashboardStats.totalProjects}
                  color={colors.primary}
                />
                <StatCard
                  icon={<Play size={20} color={colors.status.inProgress} />}
                  label={t('activeProjects')}
                  value={dashboardStats.activeProjects}
                  color={colors.status.inProgress}
                />
                <StatCard
                  icon={<CheckCircle2 size={20} color={colors.status.completed} />}
                  label={t('completedTasks')}
                  value={dashboardStats.completedTasks}
                  color={colors.status.completed}
                />
                <StatCard
                  icon={<Clock size={20} color={colors.status.paused} />}
                  label={t('pendingTasks')}
                  value={dashboardStats.pendingTasks}
                  color={colors.status.paused}
                />
              </View>

              {dashboardStats.lowStockItems > 0 && (
                <Card
                  style={{ ...styles.alertCard, backgroundColor: isDark ? colors.status.pausedBgDark : colors.status.pausedBg }}
                >
                  <AlertTriangle size={20} color={colors.status.paused} />
                  <Text style={[styles.alertText, { color: colors.status.paused }]}>
                    {dashboardStats.lowStockItems} {t('lowStock')}
                  </Text>
                </Card>
              )}
            </PermissionGate>

            <PermissionGate permission="viewEmployees">
              {employeeStats.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      {t('employees')}
                    </Text>
                    <Text style={[styles.employeeCount, { color: colors.textSecondary }]}>
                      {employeeStats.length}
                    </Text>
                  </View>

                  {employeeStats.map((emp) => (
                    <TouchableOpacity
                      key={emp.id}
                      onPress={() => router.push(`/employee/${emp.id}`)}
                      activeOpacity={0.7}
                    >
                      <Card style={styles.employeeCard}>
                        <View style={styles.employeeRow}>
                          <View style={[styles.employeeAvatar, { backgroundColor: emp.isActive ? colors.primary : colors.surface }]}>
                            <User size={18} color={emp.isActive ? colors.primaryText : colors.textMuted} />
                          </View>
                          <View style={styles.employeeInfo}>
                            <View style={styles.employeeNameRow}>
                              <Text style={[styles.employeeName, { color: emp.isActive ? colors.text : colors.textMuted }]}>
                                {emp.name}
                              </Text>
                              {!emp.isActive && (
                                <View style={[styles.inactiveBadge, { backgroundColor: colors.status.inProgress + '20' }]}>
                                  <Text style={[styles.inactiveText, { color: colors.status.inProgress }]}>
                                    Inactive
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.employeeRole, { color: colors.textSecondary }]}>
                              {emp.role === 'manager' ? t('manager') : t('employee')}
                            </Text>
                          </View>
                          <View style={styles.employeeStats}>
                            <View style={styles.taskStat}>
                              <CheckCircle2 size={14} color={colors.status.completed} />
                              <Text style={[styles.taskStatText, { color: colors.text }]}>
                                {emp.completedTasks}
                              </Text>
                            </View>
                            <View style={styles.taskStat}>
                              <Clock size={14} color={colors.status.paused} />
                              <Text style={[styles.taskStatText, { color: colors.text }]}>
                                {emp.pendingTasks}
                              </Text>
                            </View>
                          </View>
                          <ChevronRight size={18} color={colors.textMuted} />
                        </View>
                        <View style={styles.progressContainer}>
                          <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  backgroundColor: colors.status.completed,
                                  width: `${emp.completionRate}%`,
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.progressText, { color: colors.textMuted }]}>
                            {emp.completionRate}%
                          </Text>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </PermissionGate>

            <PermissionGate permission="viewProjects">
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t('projects')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/projects')}
                    style={styles.seeAllBtn}
                  >
                    <Text style={[styles.seeAllText, { color: colors.textSecondary }]}>
                      {t('all')}
                    </Text>
                    <ChevronRight size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {recentProjects.map((project) => (
                  <Card
                    key={project.id}
                    onPress={() => router.push(`/project/${project.id}`)}
                    style={styles.projectCard}
                  >
                    <View style={styles.projectContent}>
                      <View style={styles.projectInfo}>
                        <Text style={[styles.projectName, { color: colors.text }]}>
                          {project.name}
                        </Text>
                        <Text style={[styles.projectNumber, { color: colors.textSecondary }]}>
                          {project.number}
                        </Text>
                      </View>
                      <StatusBadge status={project.status} size="small" showLabel={false} />
                    </View>
                  </Card>
                ))}
              </View>
            </PermissionGate>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
    borderWidth: 0,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
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
  employeeCount: {
    fontSize: 14,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
  },
  employeeCard: {
    marginBottom: 10,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  employeeRole: {
    fontSize: 12,
    marginTop: 2,
  },
  inactiveBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  employeeStats: {
    flexDirection: 'row',
    gap: 12,
  },
  taskStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskStatText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500' as const,
    minWidth: 32,
    textAlign: 'right',
  },
  projectCard: {
    marginBottom: 8,
  },
  projectContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  projectNumber: {
    fontSize: 13,
  },
  bottomPadding: {
    height: 24,
  },
});
