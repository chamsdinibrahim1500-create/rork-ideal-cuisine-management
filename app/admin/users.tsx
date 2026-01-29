import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Plus, Trash2, Shield, User, X, Edit3, Eye, Power } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { UserRole } from '@/types';

export default function UsersScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { users, user: currentUser, createUser, updateUser, deleteUser, toggleUserActive, loginAsUser } = useAuth();

  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as UserRole,
  });
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);

  const nonDevUsers = users.filter(u => u.role !== 'developer');

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    if (newUser.password.length < 6) {
      Alert.alert(t('error'), 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createUser(newUser);
      if (result) {
        setNewUser({ name: '', email: '', password: '', role: 'employee' });
        setShowAddUser(false);
      } else {
        Alert.alert(t('error'), 'Email already exists');
      }
    } catch (error) {
      Alert.alert(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (userId: string) => {
    const userToEdit = users.find(u => u.id === userId);
    if (!userToEdit || userToEdit.role === 'developer') return;

    setEditingUser(userId);
    setEditUserData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: '',
      role: userToEdit.role,
    });
    setShowEditUser(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !editUserData.name.trim() || !editUserData.email.trim()) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      const updates: any = {
        name: editUserData.name,
        email: editUserData.email,
        role: editUserData.role,
      };
      
      if (editUserData.password.trim()) {
        if (editUserData.password.length < 6) {
          Alert.alert(t('error'), 'Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }
        updates.password = editUserData.password;
      }

      await updateUser(editingUser, updates);
      setShowEditUser(false);
      setEditingUser(null);
    } catch (error) {
      Alert.alert(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === 'developer') return;

    Alert.alert(t('delete'), `${t('confirm')} ${userName}?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => deleteUser(userId),
      },
    ]);
  };

  const handleToggleActive = async (userId: string) => {
    await toggleUserActive(userId);
  };

  const handleLoginAs = async (userId: string) => {
    Alert.alert(
      'Login as User',
      'This will log you in as this user for preview purposes.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: async () => {
            await loginAsUser(userId);
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'developer':
        return colors.status.inProgress;
      case 'manager':
        return colors.status.paused;
      case 'employee':
        return colors.status.completed;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'developer':
        return t('developer');
      case 'manager':
        return t('manager');
      case 'employee':
        return t('employee');
    }
  };

  const roles: UserRole[] = ['employee', 'manager'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t('manageUsers'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {nonDevUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('noEmployeesAvailable')}
            </Text>
          </View>
        ) : (
          nonDevUsers.map((u) => (
            <Card key={u.id} style={[styles.userCard, !u.isActive ? styles.inactiveCard : undefined]}>
              <View style={styles.userRow}>
                <View style={[styles.avatar, { backgroundColor: u.isActive ? colors.surface : colors.border }]}>
                  <User size={20} color={u.isActive ? colors.textMuted : colors.textMuted} />
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={[styles.userName, { color: u.isActive ? colors.text : colors.textMuted }]}>
                      {u.name}
                    </Text>
                    {!u.isActive && (
                      <View style={[styles.inactiveBadge, { backgroundColor: colors.status.inProgress + '20' }]}>
                        <Text style={[styles.inactiveText, { color: colors.status.inProgress }]}>
                          Inactive
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                    {u.email}
                  </Text>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: getRoleBadgeColor(u.role) + '20' },
                    ]}
                  >
                    <Text
                      style={[styles.roleText, { color: getRoleBadgeColor(u.role) }]}
                    >
                      {getRoleLabel(u.role)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  onPress={() => handleLoginAs(u.id)}
                  style={[styles.actionBtn, { backgroundColor: colors.surface }]}
                >
                  <Eye size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleEditUser(u.id)}
                  style={[styles.actionBtn, { backgroundColor: colors.surface }]}
                >
                  <Edit3 size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push(`/admin/permissions?userId=${u.id}`)}
                  style={[styles.actionBtn, { backgroundColor: colors.surface }]}
                >
                  <Shield size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleToggleActive(u.id)}
                  style={[styles.actionBtn, { backgroundColor: u.isActive ? colors.surface : colors.status.completed + '20' }]}
                >
                  <Power size={16} color={u.isActive ? colors.status.paused : colors.status.completed} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteUser(u.id, u.name)}
                  style={[styles.actionBtn, { backgroundColor: colors.surface }]}
                >
                  <Trash2 size={16} color={colors.status.inProgress} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        <Button
          title={t('add')}
          onPress={() => setShowAddUser(true)}
          variant="outline"
          size="large"
          icon={<Plus size={18} color={colors.text} />}
          style={styles.addButton}
        />
      </ScrollView>

      <Modal
        visible={showAddUser}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddUser(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('add')} {t('employee')}
              </Text>
              <TouchableOpacity onPress={() => setShowAddUser(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Input
                label={t('name')}
                value={newUser.name}
                onChangeText={(text) => setNewUser({ ...newUser, name: text })}
                placeholder="Ex: Ahmed Ben Ali"
              />

              <Input
                label={t('email')}
                value={newUser.email}
                onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label={t('password')}
                value={newUser.password}
                onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                placeholder="Min 6 characters"
                secureTextEntry
              />

              <Text style={[styles.roleLabel, { color: colors.text }]}>{t('role')}</Text>
              <Card style={styles.rolesCard}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => setNewUser({ ...newUser, role })}
                    style={[
                      styles.roleOption,
                      { borderBottomColor: colors.borderLight },
                      role === roles[roles.length - 1] && { borderBottomWidth: 0 },
                    ]}
                  >
                    <Text style={[styles.roleOptionText, { color: colors.text }]}>
                      {getRoleLabel(role)}
                    </Text>
                    {newUser.role === role && (
                      <View style={[styles.radioSelected, { backgroundColor: colors.primary }]} />
                    )}
                    {newUser.role !== role && (
                      <View style={[styles.radioUnselected, { borderColor: colors.border }]} />
                    )}
                  </TouchableOpacity>
                ))}
              </Card>

              <Button
                title={t('save')}
                onPress={handleCreateUser}
                loading={isLoading}
                size="large"
                style={styles.saveButton}
              />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={showEditUser}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditUser(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('edit')} {t('employee')}
              </Text>
              <TouchableOpacity onPress={() => setShowEditUser(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Input
                label={t('name')}
                value={editUserData.name}
                onChangeText={(text) => setEditUserData({ ...editUserData, name: text })}
                placeholder="Ex: Ahmed Ben Ali"
              />

              <Input
                label={t('email')}
                value={editUserData.email}
                onChangeText={(text) => setEditUserData({ ...editUserData, email: text })}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label={`${t('password')} (leave empty to keep current)`}
                value={editUserData.password}
                onChangeText={(text) => setEditUserData({ ...editUserData, password: text })}
                placeholder="New password (optional)"
                secureTextEntry
              />

              <Text style={[styles.roleLabel, { color: colors.text }]}>{t('role')}</Text>
              <Card style={styles.rolesCard}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => setEditUserData({ ...editUserData, role })}
                    style={[
                      styles.roleOption,
                      { borderBottomColor: colors.borderLight },
                      role === roles[roles.length - 1] && { borderBottomWidth: 0 },
                    ]}
                  >
                    <Text style={[styles.roleOptionText, { color: colors.text }]}>
                      {getRoleLabel(role)}
                    </Text>
                    {editUserData.role === role && (
                      <View style={[styles.radioSelected, { backgroundColor: colors.primary }]} />
                    )}
                    {editUserData.role !== role && (
                      <View style={[styles.radioUnselected, { borderColor: colors.border }]} />
                    )}
                  </TouchableOpacity>
                ))}
              </Card>

              <Button
                title={t('save')}
                onPress={handleSaveEdit}
                loading={isLoading}
                size="large"
                style={styles.saveButton}
              />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  userCard: {
    marginBottom: 12,
  },
  inactiveCard: {
    opacity: 0.7,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  inactiveBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  userActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  rolesCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 16,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  roleOptionText: {
    fontSize: 16,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 32,
  },
});
