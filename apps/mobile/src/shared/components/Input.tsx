import { TextInput, View, Text } from 'react-native';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  secureTextEntry,
  autoCapitalize = 'none',
  error,
}: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-500 text-sm mb-1 ml-1">{label}</Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        className={`bg-gray-50 px-4 py-3 rounded-xl text-base text-dark ${
          error ? 'border border-red-500' : ''
        }`}
        placeholderTextColor="#8A8D91"
      />
      {error && (
        <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
