import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  Globe,
  Moon,
  Sun,
  Shield,
  Users,
  LogOut,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';
import { PermissionGate } from '@/components/PermissionGate';
import { Language } from '@/types';

export default function SettingsScreen() {
  const { colors, isDark, toggleMode } = useTheme();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { user, logout } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      '',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const getRoleName = () => {
    switch (user?.role) {
      case 'developer':
        return t('developer');
      case 'manager':
        return t('manager');
      case 'employee':
        return t('employee');
      default:
        return '';
    }
  };

  const languages: { key: Language; label: string }[] = [
    { key: 'fr', label: t('french') },
    { key: 'ar', label: t('arabic') },
    { key: 'tn', label: t('tunisian') },
  ];

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    rightElement,
    showArrow = true,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.settingRow,
        { borderBottomColor: colors.borderLight },
      ]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.surface }]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        {value && (
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            {value}
          </Text>
        )}
      </View>
      {rightElement || (showArrow && onPress && (
        <ChevronRight size={20} color={colors.textMuted} />
      ))}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('settings')}</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Card style={styles.profileCard}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <User size={32} color={colors.primaryText} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {user?.name}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                  {user?.email}
                </Text>
                <View style={[styles.roleBadge, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.roleText, { color: colors.textSecondary }]}>
                    {getRoleName()}
                  </Text>
                </View>
              </View>
            </Card>

            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('language')}
            </Text>
            <Card style={styles.section}>
              {languages.map((lang, index) => (
                <TouchableOpacity
                  key={lang.key}
                  onPress={() => setLanguage(lang.key)}
                  style={[
                    styles.languageRow,
                    index < languages.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text style={[styles.languageLabel, { color: colors.text }]}>
                    {lang.label}
                  </Text>
                  {language === lang.key && (
                    <Check size={20} color={colors.status.completed} />
                  )}
                </TouchableOpacity>
              ))}
            </Card>

            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('appearance')}
            </Text>
            <Card style={styles.section}>
              <SettingRow
                icon={isDark ? <Moon size={20} color={colors.text} /> : <Sun size={20} color={colors.text} />}
                label={isDark ? t('darkMode') : t('lightMode')}
                showArrow={false}
                rightElement={
                  <Switch
                    value={isDark}
                    onValueChange={toggleMode}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.card}
                  />
                }
              />
            </Card>

            <PermissionGate permission="viewAdminPanel">
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Administration
              </Text>
              <Card style={styles.section}>
                <SettingRow
                  icon={<Users size={20} color={colors.text} />}
                  label={t('manageUsers')}
                  onPress={() => router.push('/admin/users')}
                />
                <SettingRow
                  icon={<Shield size={20} color={colors.text} />}
                  label={t('managePermissions')}
                  onPress={() => router.push('/admin/permissions')}
                />
              </Card>
            </PermissionGate>

            <Card style={[styles.section, styles.logoutSection] as any}>
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutButton}
              >
                <LogOut size={20} color={colors.status.inProgress} />
                <Text style={[styles.logoutText, { color: colors.status.inProgress }]}>
                  {t('logout')}
                </Text>
              </TouchableOpacity>
            </Card>

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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 24,
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  settingValue: {
    fontSize: 13,
    marginTop: 2,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  languageLabel: {
    fontSize: 16,
  },
  logoutSection: {
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  bottomPadding: {
    height: 24,
  },
});
