import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProjectStatus, TaskStatus, StockStatus } from '@/types';

type StatusType = ProjectStatus | TaskStatus | StockStatus;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
  showLabel = true,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
      case 'available':
        return colors.status.completed;
      case 'paused':
      case 'low':
        return colors.status.paused;
      case 'in_progress':
      case 'pending':
      case 'out_of_stock':
        return colors.status.inProgress;
      default:
        return colors.textMuted;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'completed':
      case 'available':
        return isDark ? colors.status.completedBgDark : colors.status.completedBg;
      case 'paused':
      case 'low':
        return isDark ? colors.status.pausedBgDark : colors.status.pausedBg;
      case 'in_progress':
      case 'pending':
      case 'out_of_stock':
        return isDark ? colors.status.inProgressBgDark : colors.status.inProgressBg;
      default:
        return colors.surface;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'completed':
        return t('completed');
      case 'paused':
        return t('paused');
      case 'in_progress':
        return t('inProgress');
      case 'pending':
        return t('pending');
      case 'available':
        return t('available');
      case 'low':
        return t('lowStock');
      case 'out_of_stock':
        return t('outOfStock');
      default:
        return status;
    }
  };

  const getDotSize = () => {
    switch (size) {
      case 'small':
        return 8;
      case 'medium':
        return 12;
      case 'large':
        return 16;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 11;
      case 'medium':
        return 13;
      case 'large':
        return 15;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 4, paddingHorizontal: 8 };
      case 'medium':
        return { paddingVertical: 6, paddingHorizontal: 12 };
      case 'large':
        return { paddingVertical: 8, paddingHorizontal: 16 };
    }
  };

  if (!showLabel) {
    return (
      <View
        style={[
          styles.dot,
          {
            width: getDotSize(),
            height: getDotSize(),
            backgroundColor: getStatusColor(),
            borderRadius: getDotSize() / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          ...getPadding(),
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            width: getDotSize() - 4,
            height: getDotSize() - 4,
            backgroundColor: getStatusColor(),
            borderRadius: (getDotSize() - 4) / 2,
            marginRight: 6,
          },
        ]}
      />
      <Text
        style={[
          styles.label,
          {
            color: getStatusColor(),
            fontSize: getFontSize(),
          },
        ]}
      >
        {getLabel()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
  },
  dot: {},
  label: {
    fontWeight: '600' as const,
  },
});
