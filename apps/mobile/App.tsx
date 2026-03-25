import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigation } from './src/navigation';
import { SplashView } from './src/shared/components/SplashView';
import { useAuthStore } from './src/shared/stores/auth';
import { connectSocket, disconnectSocket } from './src/shared/services/socket';
import { ErrorBoundary } from './src/shared/components/ErrorBoundary';
import { ToastProvider } from './src/shared/components/Toast';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [splashMounted, setSplashMounted] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // wrap async call so useEffect return value stays clean
    void hydrate();

    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimeElapsed && !isLoading) {
      setSplashVisible(false); // triggers fade-out; onHide will unmount
    }
  }, [minTimeElapsed, isLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="dark" />
          {splashMounted && (
            <SplashView
              visible={splashVisible}
              onHide={() => setSplashMounted(false)}
            />
          )}
          <RootNavigation />
        </GestureHandlerRootView>
      </ToastProvider>
    </ErrorBoundary>
  );
}
