import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from './Avatar';
import { useThemeColors } from '../hooks/useThemeColors';

export interface InAppNotifPayload {
  type: 'message' | 'request';
  senderId: string;
  senderName?: string;
  senderAvatarUrl?: string | null;
  senderAvatarColor?: string;
  preview: string;
  conversationId?: string;
}

interface InAppNotifHandle {
  show: (payload: InAppNotifPayload) => void;
}

export const inAppNotifRef: { current: InAppNotifHandle | null } = { current: null };

interface ContextType {
  showNotification: (payload: InAppNotifPayload) => void;
}

const InAppNotifContext = createContext<ContextType | undefined>(undefined);

export function useInAppNotification() {
  const ctx = useContext(InAppNotifContext);
  if (!ctx) throw new Error('useInAppNotification must be used within InAppNotificationProvider');
  return ctx;
}

// Module-level show function wired to the provider's state setter
// (set by the provider after mount via the ref)

export function InAppNotificationProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<InAppNotifPayload | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const dismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Navigation is accessed via dynamic import to avoid circular deps
  const [onTapNav, setOnTapNav] = useState<(() => void) | null>(null);

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [translateY]);

  const show = useCallback(
    (p: InAppNotifPayload) => {
      if (dismissTimeout.current) clearTimeout(dismissTimeout.current);

      setPayload(p);
      setVisible(true);

      // Build tap handler based on type
      if (p.type === 'message' && p.conversationId) {
        const convId = p.conversationId;
        setOnTapNav(() => () => {
          import('../../navigation/navigationRef').then(({ navigationRef }) => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('Chat', { conversationId: convId });
            }
          });
          dismiss();
        });
      } else {
        setOnTapNav(() => () => {
          import('../../navigation/navigationRef').then(({ navigationRef }) => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('Home');
            }
          });
          dismiss();
        });
      }

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      dismissTimeout.current = setTimeout(dismiss, 4000);
    },
    [translateY, dismiss],
  );

  // Expose via module-level ref so socket.ts can call it outside React
  React.useEffect(() => {
    inAppNotifRef.current = { show };
    return () => { inAppNotifRef.current = null; };
  }, [show]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
    onPanResponderMove: (_, g) => {
      if (g.dy < 0) translateY.setValue(g.dy);
    },
    onPanResponderRelease: (_, g) => {
      if (g.dy < -30) {
        dismiss();
      } else {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  });

  const senderName = payload?.senderName ?? 'Someone';
  const avatarColor = payload?.senderAvatarColor ?? '#0084FF';

  return (
    <InAppNotifContext.Provider value={{ showNotification: show }}>
      {children}
      {visible && payload && (
        <Animated.View
          style={[
            styles.container,
            {
              top: insets.top + 8,
              backgroundColor: colors.bg,
              shadowColor: colors.dark,
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => onTapNav?.()}
            style={styles.inner}
          >
            <Avatar
              uri={payload.senderAvatarUrl ?? null}
              name={senderName}
              color={avatarColor}
              size={44}
            />
            <View style={styles.text}>
              <Text style={[styles.name, { color: colors.dark }]} numberOfLines={1}>
                {senderName}
              </Text>
              <Text style={[styles.preview, { color: colors.gray500 }]} numberOfLines={2}>
                {payload.preview}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </InAppNotifContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 16,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    zIndex: 9999,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  text: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
  },
});
