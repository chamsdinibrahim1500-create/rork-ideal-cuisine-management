import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { Plus, MapPin, Users, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/Card';
import { SearchBar } from '@/components/SearchBar';
import { FilterBar } from '@/components/FilterBar';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { PermissionGate } from '@/components/PermissionGate';
import { Button } from '@/components/Button';
import { ProjectStatus } from '@/types';
import { colors as colorConstants } from '@/constants/colors';

export default function ProjectsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { projects } = useData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const filterOptions = [
    { key: 'all', label: t('all') },
    { key: 'in_progress', label: t('inProgress'), color: colorConstants.status.inProgress },
    { key: 'paused', label: t('paused'), color: colorConstants.status.paused },
    { key: 'completed', label: t('completed'), color: colorConstants.status.completed },
  ];

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.number.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getStatusSquareColor = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return colorConstants.status.completed;
      case 'paused':
        return colorConstants.status.paused;
      case 'in_progress':
        return colorConstants.status.inProgress;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('projects')}</Text>
            <PermissionGate permission="createProjects">
              <TouchableOpacity
                onPress={() => router.push('/project/create')}
                style={[styles.addButton, { backgroundColor: colors.primary }]}
              >
                <Plus size={22} color={colors.primaryText} />
              </TouchableOpacity>
            </PermissionGate>
          </View>

          <View style={styles.searchContainer}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('search')}
            />
          </View>

          <View style={styles.filterContainer}>
            <FilterBar
              options={filterOptions}
              selected={statusFilter}
              onSelect={setStatusFilter}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
          >
            {filteredProjects.length === 0 ? (
              <EmptyState
                icon={<Plus size={32} color={colors.textMuted} />}
                title={t('noProjects')}
                action={
                  hasPermission('createProjects') ? (
                    <Button
                      title={t('createProject')}
                      onPress={() => router.push('/project/create')}
                      size="medium"
                    />
                  ) : undefined
                }
              />
            ) : (
              filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  onPress={() => router.push(`/project/${project.id}`)}
                  style={styles.projectCard}
                >
                  <View style={styles.projectRow}>
                    <View style={styles.projectInfo}>
                      <Text style={[styles.projectName, { color: colors.text }]}>
                        {project.name}
                      </Text>
                      <Text style={[styles.projectNumber, { color: colors.textSecondary }]}>
                        {project.number}
                      </Text>

                      <View style={styles.projectMeta}>
                        <View style={styles.metaItem}>
                          <MapPin size={14} color={colors.textMuted} />
                          <Text
                            style={[styles.metaText, { color: colors.textMuted }]}
                            numberOfLines={1}
                          >
                            {project.location.address}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Users size={14} color={colors.textMuted} />
                          <Text style={[styles.metaText, { color: colors.textMuted }]}>
                            {project.assignedEmployees.length}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.projectRight}>
                      <View
                        style={[
                          styles.statusSquare,
                          { backgroundColor: getStatusSquareColor(project.status) },
                        ]}
                      />
                      <ChevronRight size={20} color={colors.textMuted} />
                    </View>
                  </View>
                </Card>
              ))
            )}
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
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterContainer: {
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  projectCard: {
    marginBottom: 12,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  projectNumber: {
    fontSize: 13,
    marginBottom: 8,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    maxWidth: 120,
  },
  projectRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusSquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
});
