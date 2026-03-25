import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const baseStyle = 'py-3 px-6 rounded-full items-center justify-center';
  const variantStyles = {
    primary: 'bg-primary',
    secondary: 'bg-gray-100',
    ghost: 'bg-transparent',
  };
  const textStyles = {
    primary: 'text-white font-semibold text-base',
    secondary: 'text-dark font-semibold text-base',
    ghost: 'text-primary font-semibold text-base',
  };

  return (
    <TouchableOpacity
      className={`${baseStyle} ${variantStyles[variant]} ${disabled || loading ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#0084FF'} />
      ) : (
        <Text className={textStyles[variant]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
