"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootNavigation = RootNavigation;
var react_native_1 = require("react-native");
var native_1 = require("@react-navigation/native");
var navigationRef_1 = require("./navigationRef");
var native_stack_1 = require("@react-navigation/native-stack");
var bottom_tabs_1 = require("@react-navigation/bottom-tabs");
var vector_icons_1 = require("@expo/vector-icons");
var auth_1 = require("../shared/stores/auth");
var theme_1 = require("../shared/stores/theme");
var useThemeColors_1 = require("../shared/hooks/useThemeColors");
var notifications_1 = require("../shared/stores/notifications");
// Auth screens
var LoginScreen_1 = require("../features/auth/LoginScreen");
var RegisterScreen_1 = require("../features/auth/RegisterScreen");
// Main screens
var ConversationsScreen_1 = require("../features/chat/ConversationsScreen");
var ChatScreen_1 = require("../features/chat/ChatScreen");
var ContactsScreen_1 = require("../features/contacts/ContactsScreen");
var ContactProfileScreen_1 = require("../features/contacts/ContactProfileScreen");
var NotificationsScreen_1 = require("../features/notifications/NotificationsScreen");
var ProfileScreen_1 = require("../features/profile/ProfileScreen");
var SettingsScreen_1 = require("../features/settings/SettingsScreen");
var UserProfileScreen_1 = require("../features/contacts/UserProfileScreen");
var AuthStack = (0, native_stack_1.createNativeStackNavigator)();
var MainStack = (0, native_stack_1.createNativeStackNavigator)();
var Tab = (0, bottom_tabs_1.createBottomTabNavigator)();
var TAB_ICONS = {
    Chats: { filled: 'chatbubble', outline: 'chatbubble-outline' },
    Contacts: { filled: 'people', outline: 'people-outline' },
    Notifications: { filled: 'notifications', outline: 'notifications-outline' },
    Profile: { filled: 'person-circle', outline: 'person-circle-outline' },
};
function Badge(_a) {
    var count = _a.count;
    if (count <= 0)
        return null;
    return (<react_native_1.View style={badgeStyles.badge}>
            <react_native_1.Text style={badgeStyles.badgeText}>{count > 99 ? '99+' : count}</react_native_1.Text>
        </react_native_1.View>);
}
var badgeStyles = react_native_1.StyleSheet.create({
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
    var colors = (0, useThemeColors_1.useThemeColors)();
    var totalUnread = (0, notifications_1.useNotificationsStore)(function (s) { return s.totalUnreadMessages; });
    var pendingCount = (0, notifications_1.useNotificationsStore)(function (s) { return s.pendingRequestsCount; });
    return (<Tab.Navigator screenOptions={function (_a) {
            var route = _a.route, navigation = _a.navigation;
            return ({
                tabBarIcon: function (_a) {
                    var _b, _c;
                    var focused = _a.focused, color = _a.color;
                    var icon = focused
                        ? (_b = TAB_ICONS[route.name]) === null || _b === void 0 ? void 0 : _b.filled
                        : (_c = TAB_ICONS[route.name]) === null || _c === void 0 ? void 0 : _c.outline;
                    var badge = route.name === 'Chats'
                        ? totalUnread
                        : route.name === 'Notifications'
                            ? pendingCount
                            : 0;
                    return (<react_native_1.View>
                            <vector_icons_1.Ionicons name={icon} size={24} color={color}/>
                            <Badge count={badge}/>
                        </react_native_1.View>);
                },
                tabBarLabel: function (_a) {
                    var focused = _a.focused, color = _a.color;
                    return (<react_native_1.Text style={{ fontSize: 11, fontWeight: focused ? '600' : '400', color: color }}>
                        {route.name}
                    </react_native_1.Text>);
                },
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
                headerRight: function () { return (<react_native_1.TouchableOpacity onPress={function () { return navigation.navigate('Settings'); }} style={{
                        padding: 8,
                        borderRadius: 10,
                        marginRight: 4,
                        backgroundColor: colors.bgSecondary,
                    }} activeOpacity={0.7}>
                        <vector_icons_1.Ionicons name="settings-outline" size={20} color={colors.gray500}/>
                    </react_native_1.TouchableOpacity>); },
            });
        }}>
            <Tab.Screen name="Chats" component={ConversationsScreen_1.ConversationsScreen}/>
            <Tab.Screen name="Contacts" component={ContactsScreen_1.ContactsScreen}/>
            <Tab.Screen name="Notifications" component={NotificationsScreen_1.NotificationsScreen}/>
            <Tab.Screen name="Profile" component={ProfileScreen_1.ProfileScreen}/>
        </Tab.Navigator>);
}
function AuthNavigator() {
    return (<AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen_1.LoginScreen}/>
            <AuthStack.Screen name="Register" component={RegisterScreen_1.RegisterScreen}/>
        </AuthStack.Navigator>);
}
function MainNavigator() {
    var colors = (0, useThemeColors_1.useThemeColors)();
    return (<MainStack.Navigator>
            <MainStack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }}/>
            <MainStack.Screen name="Chat" component={ChatScreen_1.ChatScreen} options={{
            headerBackTitle: '',
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerTintColor: colors.primary,
        }}/>
            <MainStack.Screen name="Settings" component={SettingsScreen_1.SettingsScreen} options={{
            title: 'Settings',
            headerBackTitle: '',
            headerStyle: { backgroundColor: colors.bgSecondary },
            headerShadowVisible: false,
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.dark },
        }}/>
            <MainStack.Screen name="ContactProfile" component={ContactProfileScreen_1.ContactProfileScreen} options={{
            title: '',
            headerBackTitle: '',
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerTintColor: colors.primary,
        }}/>
            <MainStack.Screen name="UserProfile" component={UserProfileScreen_1.UserProfileScreen} options={{
            title: '',
            headerBackTitle: '',
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerTintColor: colors.primary,
        }}/>
        </MainStack.Navigator>);
}
function RootNavigation() {
    var isAuthenticated = (0, auth_1.useAuthStore)(function (s) { return s.isAuthenticated; });
    var isLoading = (0, auth_1.useAuthStore)(function (s) { return s.isLoading; });
    var colorScheme = (0, react_native_1.useColorScheme)();
    var mode = (0, theme_1.useThemeStore)(function (s) { return s.mode; });
    var isDark = mode === 'dark' || (mode === 'system' && colorScheme === 'dark');
    if (isLoading)
        return null;
    var navTheme = isDark
        ? __assign(__assign({}, native_1.DarkTheme), { colors: __assign(__assign({}, native_1.DarkTheme.colors), { background: '#18191A', card: '#18191A', border: '#3E4042', text: '#E4E6EB', primary: '#0084FF', notification: '#F44336' }) }) : __assign(__assign({}, native_1.DefaultTheme), { colors: __assign(__assign({}, native_1.DefaultTheme.colors), { background: '#FFFFFF', card: '#FFFFFF', border: '#E4E6EB', text: '#1C1E21', primary: '#0084FF', notification: '#F44336' }) });
    return (<native_1.NavigationContainer ref={navigationRef_1.navigationRef} theme={navTheme}>
            {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
        </native_1.NavigationContainer>);
}
