import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, type ThemeMode } from '../../shared/stores/theme';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../shared/utils/theme';

const THEME_OPTIONS: { label: string; value: ThemeMode; icon: string; description: string }[] = [
  { label: 'Light', value: 'light', icon: 'sunny-outline', description: 'Always use light mode' },
  { label: 'Dark', value: 'dark', icon: 'moon-outline', description: 'Always use dark mode' },
  { label: 'System', value: 'system', icon: 'phone-portrait-outline', description: 'Follow device setting' },
];

export function SettingsScreen() {
  const { mode, setMode } = useThemeStore();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>Appearance</Text>

      <View style={styles.card}>
        {THEME_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.option, i < THEME_OPTIONS.length - 1 && styles.optionBorder]}
            onPress={() => setMode(opt.value)}
            activeOpacity={0.6}
          >
            <View style={[styles.iconWrap, mode === opt.value && styles.iconWrapActive]}>
              <Ionicons
                name={opt.icon as any}
                size={20}
                color={mode === opt.value ? '#FFFFFF' : colors.gray500}
              />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.optionDesc}>{opt.description}</Text>
            </View>
            {mode === opt.value && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgSecondary,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.gray400,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 8,
    },
    card: {
      backgroundColor: colors.bg,
      marginHorizontal: 16,
      borderRadius: 14,
      overflow: 'hidden',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    optionBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.gray100,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    iconWrapActive: {
      backgroundColor: colors.primary,
    },
    optionInfo: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.dark,
    },
    optionDesc: {
      fontSize: 13,
      color: colors.gray400,
      marginTop: 1,
    },
  });
}
