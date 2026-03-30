import { useMemo, useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { useToast } from '../../shared/components/Toast';
import { api } from '../../shared/services/api';
import { useAuthStore } from '../../shared/stores/auth';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../shared/utils/theme';
import type { AuthResponse } from '../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

export function RegisterScreen({ navigation }: Props) {
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const setAuth = useAuthStore((s) => s.setAuth);
    const { showToast } = useToast();
    const colors = useThemeColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);

    async function handleRegister() {
        if (!username || !displayName || !password) return;

        if (username.length < 3) {
            showToast('error', 'Username must be at least 3 characters');
            return;
        }
        if (password.length < 6) {
            showToast('error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post<AuthResponse>('/auth/register', {
                username,
                password,
                displayName,
            });
            setAuth(data.user, data.accessToken, data.refreshToken);
        } catch (err: any) {
            showToast('error', err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={40}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoText}>L</Text>
                        </View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join LoZo and connect with friends</Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Display Name"
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Your name"
                            autoCapitalize="words"
                        />
                        <Input
                            label="Username"
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Choose a username"
                        />
                        <Input
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="At least 6 characters"
                            secureTextEntry
                        />
                        <Button title="Create Account" onPress={handleRegister} loading={loading} />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Text style={styles.footerLink} onPress={() => navigation.goBack()}>
                            Log In
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function makeStyles(colors: ThemeColors) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.bg,
        },
        scrollContent: {
            flexGrow: 1,
            justifyContent: 'center',
        },
        content: {
            justifyContent: 'center',
            paddingHorizontal: 32,
        },
        logoContainer: {
            alignItems: 'center',
            marginBottom: 40,
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
            color: '#FFFFFF',
            fontSize: 36,
            fontWeight: '700',
        },
        title: {
            fontSize: 28,
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
}
