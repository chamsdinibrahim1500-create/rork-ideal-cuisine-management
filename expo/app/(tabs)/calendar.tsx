import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { colors as colorConstants } from '@/constants/colors';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function CalendarScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { projects } = useData();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const projectsByDate = useMemo(() => {
    const map: Record<string, typeof projects> = {};
    projects.forEach(project => {
      const dateKey = project.startDate;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(project);
    });
    return map;
  }, [projects]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);

  const navigateMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const formatDateKey = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasProjects = (day: number) => {
    const dateKey = formatDateKey(day);
    return projectsByDate[dateKey] && projectsByDate[dateKey].length > 0;
  };

  const handleDayPress = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const selectedProjects = useMemo(() => {
    if (!selectedDate) return [];
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    return projectsByDate[dateKey] || [];
  }, [selectedDate, projectsByDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colorConstants.status.completed;
      case 'paused':
        return colorConstants.status.paused;
      case 'in_progress':
        return colorConstants.status.inProgress;
      default:
        return colors.textMuted;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('calendar')}</Text>
          </View>

          <Card style={styles.calendarCard}>
            <View style={styles.monthNav}>
              <TouchableOpacity
                onPress={() => navigateMonth(-1)}
                style={[styles.navButton, { backgroundColor: colors.surface }]}
              >
                <ChevronLeft size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.monthText, { color: colors.text }]}>
                {MONTHS_FR[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              <TouchableOpacity
                onPress={() => navigateMonth(1)}
                style={[styles.navButton, { backgroundColor: colors.surface }]}
              >
                <ChevronRight size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {DAYS_FR.map((day) => (
                <Text
                  key={day}
                  style={[styles.weekDay, { color: colors.textMuted }]}
                >
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {days.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => day && handleDayPress(day)}
                  disabled={!day}
                  style={[
                    styles.dayCell,
                    isToday(day || 0) && {
                      borderWidth: 2,
                      borderColor: colors.primary,
                    },
                    isSelected(day || 0) && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  {day && (
                    <>
                      <Text
                        style={[
                          styles.dayText,
                          { color: isSelected(day) ? colors.primaryText : colors.text },
                        ]}
                      >
                        {day}
                      </Text>
                      {hasProjects(day) && (
                        <View
                          style={[
                            styles.projectDot,
                            {
                              backgroundColor: isSelected(day)
                                ? colors.primaryText
                                : colors.status.inProgress,
                            },
                          ]}
                        />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <ScrollView
            style={styles.projectsList}
            contentContainerStyle={styles.projectsContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedDate && (
              <Text style={[styles.selectedDateText, { color: colors.textSecondary }]}>
                {selectedDate.getDate()} {MONTHS_FR[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
            )}

            {selectedProjects.length > 0 ? (
              selectedProjects.map((project) => (
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
                    </View>
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: getStatusColor(project.status) },
                      ]}
                    />
                  </View>
                </Card>
              ))
            ) : selectedDate ? (
              <View style={styles.emptyState}>
                <CalendarIcon size={32} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {t('noProjects')}
                </Text>
              </View>
            ) : null}
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
  calendarCard: {
    marginHorizontal: 16,
    padding: 16,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  projectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  projectsList: {
    flex: 1,
    marginTop: 16,
  },
  projectsContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  selectedDateText: {
    fontSize: 14,
    marginBottom: 12,
  },
  projectCard: {
    marginBottom: 8,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
