import { useColorScheme } from 'react-native';
import { useThemeStore } from '../stores/theme';
import { lightColors, darkColors, type ThemeColors } from '../utils/theme';

export function useThemeColors(): ThemeColors & { isDark: boolean } {
  const colorScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const isDark = mode === 'dark' || (mode === 'system' && colorScheme === 'dark');
  return { ...(isDark ? darkColors : lightColors), isDark };
}
