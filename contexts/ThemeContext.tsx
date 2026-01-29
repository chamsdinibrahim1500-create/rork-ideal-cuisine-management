import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, ThemeMode } from '@/constants/colors';

const THEME_STORAGE_KEY = '@ideal_cuisine_theme';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredTheme();
  }, []);

  const loadStoredTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        setModeState(stored);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    console.log('Theme changed to:', newMode);
  }, []);

  const toggleMode = useCallback(async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    await setMode(newMode);
  }, [mode, setMode]);

  const colors = useMemo(() => getColors(mode), [mode]);

  const isDark = mode === 'dark';

  return {
    mode,
    setMode,
    toggleMode,
    colors,
    isDark,
    isLoading,
  };
});
