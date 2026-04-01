import { useEffect } from 'react';
import * as Network from 'expo-network';
import { useNetworkStore } from '../stores/network';

// Socket connect/disconnect events are already handled in socket.ts.
// This hook's sole job is to seed the initial network state from the OS.
export function useNetworkState() {
  const setOnline = useNetworkStore((s) => s.setOnline);

  useEffect(() => {
    Network.getNetworkStateAsync().then((state) => {
      setOnline(!!state.isInternetReachable);
    });
  }, [setOnline]);
}
