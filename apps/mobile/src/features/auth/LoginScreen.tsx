import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { api } from '../../shared/services/api';
import { useAuthStore } from '../../shared/stores/auth';
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
      const { data } = await api.post<AuthResponse>('/auth/login', {
        username,
        password,
      });
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
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-4xl font-bold text-primary text-center mb-2">
          LoZo
        </Text>
        <Text className="text-gray-400 text-center mb-10">
          Connect with friends
        </Text>

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

        <Button title="Login" onPress={handleLogin} loading={loading} />

        <Button
          title="Create an account"
          onPress={() => navigation.navigate('Register')}
          variant="ghost"
        />
      </View>
    </KeyboardAvoidingView>
  );
}
