import { TextInput, View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  multiline?: boolean;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  secureTextEntry,
  autoCapitalize = 'none',
  error,
  multiline,
}: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor={colors.gray400}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: colors.gray500,
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.gray50,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    color: colors.dark,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.red,
  },
  error: {
    color: colors.red,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
