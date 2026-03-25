import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { api } from '../../shared/services/api';
import { useAuthStore } from '../../shared/stores/auth';
import { colors } from '../../shared/utils/theme';
import type { AuthResponse } from '../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleLogin() {
    if (!username || !password) return;
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { username, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <Text style={styles.title}>LoZo</Text>
          <Text style={styles.subtitle}>Connect with friends instantly</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />
          <Button title="Log In" onPress={handleLogin} loading={loading} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Text
            style={styles.footerLink}
            onPress={() => navigation.navigate('Register')}
          >
            Sign Up
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray400,
  },
  form: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.gray500,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
