import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  size = 'large',
}: ButtonProps) {
  const colors = useThemeColors();

  const bgColor = {
    primary: colors.primary,
    secondary: colors.gray100,
    ghost: 'transparent',
  }[variant];

  const textColor = {
    primary: '#FFFFFF',
    secondary: colors.dark,
    ghost: colors.primary,
  }[variant];

  const paddingVertical = { small: 8, medium: 12, large: 14 }[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor, paddingVertical, opacity: disabled || loading ? 0.5 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginVertical: 6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
