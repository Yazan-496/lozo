import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigation } from './src/navigation';
import { useAuthStore } from './src/shared/stores/auth';
import { connectSocket, disconnectSocket } from './src/shared/services/socket';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <RootNavigation />
    </GestureHandlerRootView>
  );
}
