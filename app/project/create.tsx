import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { MapPin, Calendar as CalendarIcon, Users, X, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function CreateProjectScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { employees } = useAuth();
  const { projects, createProject } = useData();

  const [name, setName] = useState('');
  const [number, setNumber] = useState(`IC-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, '0')}`);
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('projectName'));
      return;
    }

    if (!address.trim()) {
      Alert.alert(t('error'), t('location'));
      return;
    }

    const existingProject = projects.find(p => p.startDate === startDate);
    if (existingProject) {
      Alert.alert(t('warning'), t('duplicateDateWarning'));
      return;
    }

    setIsLoading(true);

    try {
      await createProject({
        name: name.trim(),
        number: number.trim(),
        location: {
          address: address.trim(),
          latitude: 36.8065,
          longitude: 10.1815,
        },
        startDate,
        status: 'in_progress',
        assignedEmployees: selectedEmployees,
      });

      router.back();
    } catch (error) {
      console.log('Error creating project:', error);
      Alert.alert(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t('createProject'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label={t('projectName')}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Restaurant Le Méditerranéen"
        />

        <Input
          label={t('projectNumber')}
          value={number}
          onChangeText={setNumber}
          placeholder="IC-2024-001"
        />

        <Input
          label={t('location')}
          value={address}
          onChangeText={setAddress}
          placeholder="Ex: Avenue Habib Bourguiba, Tunis"
          icon={<MapPin size={20} color={colors.textMuted} />}
        />

        <Input
          label={t('startDate')}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          icon={<CalendarIcon size={20} color={colors.textMuted} />}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            {t('assignTo')}
          </Text>
          <Card style={styles.employeesList}>
            {employees.length === 0 ? (
              <Text style={[styles.noEmployees, { color: colors.textMuted }]}>
                {t('noEmployeesAvailable')}
              </Text>
            ) : (
              employees.map((employee) => (
                <TouchableOpacity
                  key={employee.id}
                  onPress={() => toggleEmployee(employee.id)}
                  style={[
                    styles.employeeRow,
                    { borderBottomColor: colors.borderLight },
                  ]}
                >
                  <View style={styles.employeeInfo}>
                    <View style={[styles.employeeAvatar, { backgroundColor: colors.surface }]}>
                      <Users size={16} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.employeeName, { color: colors.text }]}>
                      {employee.name}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: selectedEmployees.includes(employee.id)
                          ? colors.primary
                          : 'transparent',
                        borderColor: selectedEmployees.includes(employee.id)
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    {selectedEmployees.includes(employee.id) && (
                      <Check size={14} color={colors.primaryText} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </Card>
        </View>

        <Button
          title={t('save')}
          onPress={handleCreate}
          loading={isLoading}
          size="large"
          style={styles.saveButton}
        />

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
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  employeesList: {
    padding: 0,
    overflow: 'hidden',
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  employeeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEmployees: {
    padding: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  saveButton: {
    marginTop: 16,
  },
  bottomPadding: {
    height: 32,
  },
});
