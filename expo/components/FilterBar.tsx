import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import * as Haptics from 'expo-haptics';

interface FilterOption {
  key: string;
  label: string;
  color?: string;
}

interface FilterBarProps {
  options: FilterOption[];
  selected: string;
  onSelect: (key: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  options,
  selected,
  onSelect,
}) => {
  const { colors, isDark } = useTheme();
  const { isRTL } = useLanguage();

  const handleSelect = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(key);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      {options.map((option) => {
        const isSelected = selected === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => handleSelect(option.key)}
            activeOpacity={0.7}
            style={[
              styles.option,
              {
                backgroundColor: isSelected
                  ? option.color || colors.primary
                  : colors.surface,
                borderColor: isSelected
                  ? option.color || colors.primary
                  : colors.border,
              },
            ]}
          >
            {option.color && (
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: option.color },
                ]}
              />
            )}
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? '#FFFFFF' : colors.text,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
});
