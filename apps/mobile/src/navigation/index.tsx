import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../shared/stores/auth';
import { colors } from '../shared/utils/theme';

// Auth screens
import { LoginScreen } from '../features/auth/LoginScreen';
import { RegisterScreen } from '../features/auth/RegisterScreen';

// Main screens
import { ConversationsScreen } from '../features/chat/ConversationsScreen';
import { ChatScreen } from '../features/chat/ChatScreen';
import { ContactsScreen } from '../features/contacts/ContactsScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Chats: '💬',
    Contacts: '👥',
    Profile: '👤',
  };
  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.4 }}>
      {icons[label] || '•'}
    </Text>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          backgroundColor: colors.white,
          paddingBottom: 4,
          height: 56,
        },
        headerStyle: { backgroundColor: colors.white },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.dark,
        },
      })}
    >
      <Tab.Screen name="Chats" component={ConversationsScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name="Home"
        component={HomeTabs}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerBackTitle: '',
          headerStyle: { backgroundColor: colors.white },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
        }}
      />
    </MainStack.Navigator>
  );
}

export function RootNavigation() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
