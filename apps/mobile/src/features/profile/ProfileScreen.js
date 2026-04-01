"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileScreen = ProfileScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var vector_icons_1 = require("@expo/vector-icons");
var Avatar_1 = require("../../shared/components/Avatar");
var Input_1 = require("../../shared/components/Input");
var Button_1 = require("../../shared/components/Button");
var Toast_1 = require("../../shared/components/Toast");
var api_1 = require("../../shared/services/api");
var auth_1 = require("../../shared/stores/auth");
var socket_1 = require("../../shared/services/socket");
var useThemeColors_1 = require("../../shared/hooks/useThemeColors");
function ProfileScreen(_a) {
    var navigation = _a.navigation;
    var user = (0, auth_1.useAuthStore)(function (s) { return s.user; });
    var setUser = (0, auth_1.useAuthStore)(function (s) { return s.setUser; });
    var logout = (0, auth_1.useAuthStore)(function (s) { return s.logout; });
    var showToast = (0, Toast_1.useToast)().showToast;
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    var _b = (0, react_1.useState)(false), editing = _b[0], setEditing = _b[1];
    var _c = (0, react_1.useState)((user === null || user === void 0 ? void 0 : user.displayName) || ''), displayName = _c[0], setDisplayName = _c[1];
    var _d = (0, react_1.useState)((user === null || user === void 0 ? void 0 : user.bio) || ''), bio = _d[0], setBio = _d[1];
    var _e = (0, react_1.useState)(false), loading = _e[0], setLoading = _e[1];
    function handleSave() {
        return __awaiter(this, void 0, void 0, function () {
            var data, err_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        setLoading(true);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, api_1.api.put('/auth/profile', { displayName: displayName, bio: bio })];
                    case 2:
                        data = (_c.sent()).data;
                        setUser(data);
                        setEditing(false);
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _c.sent();
                        showToast('error', ((_b = (_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to update');
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleLogout() {
        react_native_1.Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: function () {
                    (0, socket_1.disconnectSocket)();
                    logout();
                },
            },
        ]);
    }
    if (!user)
        return null;
    var menuItems = [
        {
            label: 'Edit Profile',
            icon: 'person-outline',
            onPress: function () { return setEditing(true); },
        },
        {
            label: 'Settings',
            icon: 'settings-outline',
            onPress: function () { return navigation.navigate('Settings'); },
        },
        {
            label: 'Change Password',
            icon: 'lock-closed-outline',
            onPress: function () { return showToast('info', 'Coming soon'); },
        },
    ];
    return (<react_native_1.ScrollView style={styles.container}>
      <react_native_1.View style={styles.header}>
        <Avatar_1.Avatar uri={user.avatarUrl} name={user.displayName} color={user.avatarColor} size={96}/>
        <react_native_1.Text style={styles.displayName}>{user.displayName}</react_native_1.Text>
        <react_native_1.Text style={styles.username}>@{user.username}</react_native_1.Text>
        {user.bio ? <react_native_1.Text style={styles.bio}>{user.bio}</react_native_1.Text> : null}
      </react_native_1.View>

      <react_native_1.View style={styles.content}>
        {editing ? (<>
            <Input_1.Input label="Display Name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words"/>
            <Input_1.Input label="Bio" value={bio} onChangeText={setBio} placeholder="About you..." autoCapitalize="sentences"/>
            <Button_1.Button title="Save" onPress={handleSave} loading={loading}/>
            <Button_1.Button title="Cancel" onPress={function () {
                setEditing(false);
                setDisplayName(user.displayName);
                setBio(user.bio);
            }} variant="ghost"/>
          </>) : (<>
            {menuItems.map(function (item) { return (<react_native_1.TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.6}>
                <vector_icons_1.Ionicons name={item.icon} size={20} color={colors.gray500} style={styles.menuIcon}/>
                <react_native_1.Text style={styles.menuText}>{item.label}</react_native_1.Text>
                <react_native_1.Text style={styles.menuArrow}>›</react_native_1.Text>
              </react_native_1.TouchableOpacity>); })}

            <react_native_1.TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout} activeOpacity={0.6}>
              <vector_icons_1.Ionicons name="log-out-outline" size={20} color={colors.red} style={styles.menuIcon}/>
              <react_native_1.Text style={styles.logoutText}>Logout</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </>)}
      </react_native_1.View>
    </react_native_1.ScrollView>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.bgSecondary,
        },
        header: {
            alignItems: 'center',
            paddingTop: 32,
            paddingBottom: 24,
            backgroundColor: colors.bg,
            marginBottom: 16,
        },
        displayName: {
            fontSize: 22,
            fontWeight: '700',
            color: colors.dark,
            marginTop: 12,
        },
        username: {
            fontSize: 15,
            color: colors.gray400,
            marginTop: 2,
        },
        bio: {
            fontSize: 15,
            color: colors.gray500,
            marginTop: 6,
            textAlign: 'center',
            paddingHorizontal: 40,
        },
        content: {
            paddingHorizontal: 16,
        },
        menuItem: {
            backgroundColor: colors.bg,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 12,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
        },
        menuIcon: {
            marginRight: 12,
        },
        menuText: {
            fontSize: 16,
            color: colors.dark,
            flex: 1,
        },
        menuArrow: {
            fontSize: 20,
            color: colors.gray400,
            fontWeight: '600',
        },
        logoutItem: {
            marginTop: 8,
        },
        logoutText: {
            fontSize: 16,
            color: colors.red,
            flex: 1,
        },
    });
}
