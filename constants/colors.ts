export const colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    primary: '#1A1A1A',
    primaryText: '#FFFFFF',
    accent: '#374151',
  },
  dark: {
    background: '#0A0A0A',
    surface: '#141414',
    card: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    border: '#2D2D2D',
    borderLight: '#1F1F1F',
    primary: '#FFFFFF',
    primaryText: '#0A0A0A',
    accent: '#E5E7EB',
  },
  status: {
    completed: '#22C55E',
    completedBg: '#DCFCE7',
    completedBgDark: '#14532D',
    paused: '#EAB308',
    pausedBg: '#FEF9C3',
    pausedBgDark: '#713F12',
    inProgress: '#EF4444',
    inProgressBg: '#FEE2E2',
    inProgressBgDark: '#7F1D1D',
  },
  stock: {
    available: '#22C55E',
    low: '#EAB308',
    outOfStock: '#EF4444',
  },
};

export type ThemeMode = 'light' | 'dark';

export const getColors = (mode: ThemeMode) => ({
  ...colors[mode],
  status: colors.status,
  stock: colors.stock,
});
