import { useColorScheme, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../shared/stores/auth';
import { useThemeStore } from '../shared/stores/theme';
import { useThemeColors } from '../shared/hooks/useThemeColors';
import { useNotificationsStore } from '../shared/stores/notifications';

// Auth screens
import { LoginScreen } from '../features/auth/LoginScreen';
import { RegisterScreen } from '../features/auth/RegisterScreen';

// Main screens
import { ConversationsScreen } from '../features/chat/ConversationsScreen';
import { ChatScreen } from '../features/chat/ChatScreen';
import { ContactsScreen } from '../features/contacts/ContactsScreen';
import { ContactProfileScreen } from '../features/contacts/ContactProfileScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { UserProfileScreen } from '../features/contacts/UserProfileScreen';
import { MediaGalleryScreen } from '../features/chat/MediaGalleryScreen';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { filled: string; outline: string }> = {
    Chats: { filled: 'chatbubble', outline: 'chatbubble-outline' },
    Contacts: { filled: 'people', outline: 'people-outline' },
    Notifications: { filled: 'notifications', outline: 'notifications-outline' },
    Profile: { filled: 'person-circle', outline: 'person-circle-outline' },
};

function Badge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
        <View style={badgeStyles.badge}>
            <Text style={badgeStyles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
    );
}

const badgeStyles = StyleSheet.create({
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#F44336',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
});

function HomeTabs() {
    const colors = useThemeColors();
    const totalUnread = useNotificationsStore((s) => s.totalUnreadMessages);
    const pendingCount = useNotificationsStore((s) => s.pendingRequestsCount);

    return (
        <Tab.Navigator
            screenOptions={({ route, navigation }) => ({
                tabBarIcon: ({ focused, color }) => {
                    const icon = focused
                        ? TAB_ICONS[route.name]?.filled
                        : TAB_ICONS[route.name]?.outline;
                    const badge =
                        route.name === 'Chats'
                            ? totalUnread
                            : route.name === 'Notifications'
                              ? pendingCount
                              : 0;
                    return (
                        <View>
                            <Ionicons name={icon as any} size={24} color={color} />
                            <Badge count={badge} />
                        </View>
                    );
                },
                tabBarLabel: ({ focused, color }) => (
                    <Text style={{ fontSize: 11, fontWeight: focused ? '600' : '400', color }}>
                        {route.name}
                    </Text>
                ),
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.gray400,
                tabBarStyle: {
                    borderTopColor: colors.border,
                    borderTopWidth: 0.5,
                    backgroundColor: colors.bg,
                    paddingBottom: 4,
                    height: 56,
                },
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                headerTitleStyle: {
                    fontSize: 20,
                    fontWeight: '700',
                    color: colors.dark,
                },
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Settings')}
                        style={{
                            padding: 8,
                            borderRadius: 10,
                            marginRight: 4,
                            backgroundColor: colors.bgSecondary,
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="settings-outline" size={20} color={colors.gray500} />
                    </TouchableOpacity>
                ),
            })}
        >
            <Tab.Screen name="Chats" component={ConversationsScreen} />
            <Tab.Screen name="Contacts" component={ContactsScreen} />
            <Tab.Screen name="Notifications" component={NotificationsScreen} />
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
    const colors = useThemeColors();

    return (
        <MainStack.Navigator>
            <MainStack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
            <MainStack.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: colors.bg },
                    headerShadowVisible: false,
                    headerTintColor: colors.primary,
                }}
            />
            <MainStack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: 'Settings',
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: colors.bgSecondary },
                    headerShadowVisible: false,
                    headerTintColor: colors.primary,
                    headerTitleStyle: { color: colors.dark },
                }}
            />
            <MainStack.Screen
                name="ContactProfile"
                component={ContactProfileScreen}
                options={{
                    title: '',
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: colors.bg },
                    headerShadowVisible: false,
                    headerTintColor: colors.primary,
                }}
            />
            <MainStack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{
                    title: '',
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: colors.bg },
                    headerShadowVisible: false,
                    headerTintColor: colors.primary,
                }}
            />
            <MainStack.Screen
                name="MediaGallery"
                component={MediaGalleryScreen}
                options={{
                    title: 'Media',
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: colors.bg },
                    headerShadowVisible: false,
                    headerTintColor: colors.primary,
                    headerTitleStyle: { color: colors.dark },
                }}
            />
        </MainStack.Navigator>
    );
}

export function RootNavigation() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isLoading = useAuthStore((s) => s.isLoading);
    const colorScheme = useColorScheme();
    const mode = useThemeStore((s) => s.mode);
    const isDark = mode === 'dark' || (mode === 'system' && colorScheme === 'dark');

    if (isLoading) return null;

    const navTheme = isDark
        ? {
              ...DarkTheme,
              colors: {
                  ...DarkTheme.colors,
                  background: '#18191A',
                  card: '#18191A',
                  border: '#3E4042',
                  text: '#E4E6EB',
                  primary: '#0084FF',
                  notification: '#F44336',
              },
          }
        : {
              ...DefaultTheme,
              colors: {
                  ...DefaultTheme.colors,
                  background: '#FFFFFF',
                  card: '#FFFFFF',
                  border: '#E4E6EB',
                  text: '#1C1E21',
                  primary: '#0084FF',
                  notification: '#F44336',
              },
          };

    return (
        <NavigationContainer ref={navigationRef} theme={navTheme}>
            {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}
