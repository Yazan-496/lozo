import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors as colors } from '../utils/theme';

export type ToastType = 'error' | 'success' | 'info';

interface ToastState {
  visible: boolean;
  type: ToastType;
  message: string;
  id: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const toastRef = React.createRef<{ showToast: (type: ToastType, message: string) => void }>();

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '', id: 0 });
  const translateY = useRef(new Animated.Value(-100)).current;
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextIdRef = useRef(0);

  const showToast = (type: ToastType, message: string) => {
    // Cancel previous dismiss timeout
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }

    const id = nextIdRef.current++;
    setToast({ visible: true, type, message, id });

    // Animate in
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after 3 seconds
    dismissTimeoutRef.current = setTimeout(() => {
      dismissToast();
    }, 3000);
  };

  const dismissToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToast({ visible: false, type: 'info', message: '', id: 0 });
    });
  };

  // Setup PanResponder for swipe-up dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => toast.visible,
      onMoveShouldSetPanResponder: (_, { dy }) => toast.visible && dy < -10,
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy < -20 || vy < -0.5) {
          dismissToast();
        }
      },
    })
  ).current;

  // Expose showToast on ref
  useEffect(() => {
    if (toastRef.current) {
      toastRef.current.showToast = showToast;
    }
  }, []);

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'error':
        return colors.red;
      case 'success':
        return colors.green;
      case 'info':
        return colors.primary;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.safeArea, { paddingTop: insets.top || 12 }]}>
            <View style={[styles.toast, { backgroundColor: getBackgroundColor() }]}>
              <Text style={styles.message}>{toast.message}</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  safeArea: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
