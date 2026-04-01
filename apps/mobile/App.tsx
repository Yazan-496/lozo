import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import { RootNavigation } from './src/navigation';
import { SplashView } from './src/shared/components/SplashView';
import { useAuthStore } from './src/shared/stores/auth';
import { useThemeStore } from './src/shared/stores/theme';
import { useNetworkStore } from './src/shared/stores/network';
import { connectSocket, disconnectSocket } from './src/shared/services/socket';
import { ErrorBoundary } from './src/shared/components/ErrorBoundary';
import { ToastProvider } from './src/shared/components/Toast';
import { InAppNotificationProvider } from './src/shared/components/InAppNotification';
import { initDatabase, getDb } from './src/shared/db/sqlite';
import { pruneOldMessages } from './src/shared/db/messages.db.ts';
import { useNetworkState } from './src/shared/hooks/useNetworkState';

export default function App() {
    const hydrate = useAuthStore((s) => s.hydrate);
    const hydrateTheme = useThemeStore((s) => s.hydrate);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isLoading = useAuthStore((s) => s.isLoading);
    const themeMode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme();

    const [splashMounted, setSplashMounted] = useState(true);
    const [splashVisible, setSplashVisible] = useState(true);
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);

    // Initialize network state monitoring
    useNetworkState();

    useEffect(() => {
        const initApp = async () => {
            // Initialize SQLite database
            await initDatabase();

            // Get initial network state
            const netState = await Network.getNetworkStateAsync();
            useNetworkStore.getState().setOnline(!!netState.isInternetReachable);

            // Run pruning in background after short delay
            setTimeout(() => void pruneOldMessages(), 2000);
        };

        void initApp();
        void hydrate();
        void hydrateTheme();

        const timer = setTimeout(() => {
            setMinTimeElapsed(true);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (minTimeElapsed && !isLoading) {
            setSplashVisible(false);
        }
    }, [minTimeElapsed, isLoading]);

    useEffect(() => {
        if (isAuthenticated) {
            connectSocket();
        } else {
            disconnectSocket();
        }
    }, [isAuthenticated]);

    const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <ToastProvider>
                    <InAppNotificationProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <StatusBar style={isDark ? 'light' : 'dark'} />
                        {splashMounted && (
                            <SplashView
                                visible={splashVisible}
                                onHide={() => setSplashMounted(false)}
                            />
                        )}
                        <RootNavigation />
                    </GestureHandlerRootView>
                    </InAppNotificationProvider>
                </ToastProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}
