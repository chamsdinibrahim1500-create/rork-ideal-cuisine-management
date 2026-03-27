import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { UserPermissions } from '@/types';
import { permissionLabels } from '@/constants/permissions';

export default function PermissionsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const { users, updateUserPermissions, user: currentUser } = useAuth();

  const selectedUser = users.find(u => u.id === userId);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      setPermissions({ ...selectedUser.permissions });
    }
  }, [selectedUser]);

  if (!selectedUser || !permissions) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: t('managePermissions'),
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>
          User not found
        </Text>
      </View>
    );
  }

  const handleToggle = (key: keyof UserPermissions) => {
    setPermissions(prev => prev ? { ...prev, [key]: !prev[key] } : null);
  };

  const handleSave = async () => {
    if (!permissions) return;

    setIsLoading(true);
    try {
      await updateUserPermissions(selectedUser.id, permissions);
      Alert.alert(t('success'), t('permissions') + ' updated');
    } catch (error) {
      Alert.alert(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const permissionGroups: { title: string; keys: (keyof UserPermissions)[] }[] = [
    {
      title: 'Dashboard',
      keys: ['viewDashboard'],
    },
    {
      title: t('projects'),
      keys: ['viewProjects', 'createProjects', 'editProjects', 'deleteProjects'],
    },
    {
      title: t('tasks'),
      keys: ['viewTasks', 'createTasks', 'editTasks', 'deleteTasks', 'assignTasks'],
    },
    {
      title: t('workflow'),
      keys: ['viewWorkflow', 'editWorkflow'],
    },
    {
      title: t('stock'),
      keys: ['viewStock', 'editStock', 'addStock', 'deleteStock'],
    },
    {
      title: t('calendar'),
      keys: ['viewCalendar'],
    },
    {
      title: t('employees'),
      keys: ['viewEmployees', 'manageEmployees'],
    },
    {
      title: t('files'),
      keys: ['viewFiles', 'uploadFiles', 'downloadFiles', 'deleteFiles', 'sendFiles'],
    },
    {
      title: 'Rapports',
      keys: ['viewReports', 'createReports'],
    },
    {
      title: 'Administration',
      keys: ['viewSettings', 'managePermissions', 'viewAdminPanel'],
    },
  ];

  const getPermissionLabel = (key: keyof UserPermissions) => {
    const labels = permissionLabels[key];
    return labels[language] || key;
  };

  const isDeveloper = selectedUser.role === 'developer';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: `${t('permissions')} - ${selectedUser.name}`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isDeveloper && (
          <Card style={{ ...styles.warningCard, backgroundColor: colors.status.pausedBg }}>
            <Text style={[styles.warningText, { color: colors.status.paused }]}>
              {t('developerFullAccess')}
            </Text>
          </Card>
        )}

        {permissionGroups.map((group) => (
          <View key={group.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {group.title}
            </Text>
            <Card style={styles.permissionsCard}>
              {group.keys.map((key, index) => (
                <View
                  key={key}
                  style={[
                    styles.permissionRow,
                    { borderBottomColor: colors.borderLight },
                    index === group.keys.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={[styles.permissionLabel, { color: colors.text }]}>
                    {getPermissionLabel(key)}
                  </Text>
                  <Switch
                    value={permissions[key]}
                    onValueChange={() => handleToggle(key)}
                    disabled={isDeveloper}
                    trackColor={{ false: colors.border, true: colors.status.completed }}
                    thumbColor={colors.card}
                  />
                </View>
              ))}
            </Card>
          </View>
        ))}

        {!isDeveloper && (
          <Button
            title={t('save')}
            onPress={handleSave}
            loading={isLoading}
            size="large"
            style={styles.saveButton}
          />
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  warningCard: {
    marginBottom: 16,
    padding: 14,
    borderWidth: 0,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  permissionsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  permissionLabel: {
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  saveButton: {
    marginTop: 8,
  },
  bottomPadding: {
    height: 32,
  },
});
