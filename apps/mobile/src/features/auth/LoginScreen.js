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
exports.LoginScreen = LoginScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var Input_1 = require("../../shared/components/Input");
var Button_1 = require("../../shared/components/Button");
var Toast_1 = require("../../shared/components/Toast");
var api_1 = require("../../shared/services/api");
var auth_1 = require("../../shared/stores/auth");
var useThemeColors_1 = require("../../shared/hooks/useThemeColors");
function LoginScreen(_a) {
    var navigation = _a.navigation;
    var _b = (0, react_1.useState)(''), username = _b[0], setUsername = _b[1];
    var _c = (0, react_1.useState)(''), password = _c[0], setPassword = _c[1];
    var _d = (0, react_1.useState)(false), loading = _d[0], setLoading = _d[1];
    var setAuth = (0, auth_1.useAuthStore)(function (s) { return s.setAuth; });
    var showToast = (0, Toast_1.useToast)().showToast;
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    function handleLogin() {
        return __awaiter(this, void 0, void 0, function () {
            var data, err_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!username || !password)
                            return [2 /*return*/];
                        setLoading(true);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, api_1.api.post('/auth/login', { username: username, password: password })];
                    case 2:
                        data = (_c.sent()).data;
                        setAuth(data.user, data.accessToken, data.refreshToken);
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _c.sent();
                        showToast('error', ((_b = (_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Login failed');
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    return (<react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container} keyboardVerticalOffset={40}>
            <react_native_1.ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <react_native_1.View style={styles.content}>
                    <react_native_1.View style={styles.logoContainer}>
                        <react_native_1.View style={styles.logoCircle}>
                            <react_native_1.Text style={styles.logoText}>L</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.Text style={styles.title}>LoZo</react_native_1.Text>
                        <react_native_1.Text style={styles.subtitle}>Connect with friends instantly</react_native_1.Text>
                    </react_native_1.View>

                    <react_native_1.View style={styles.form}>
                        <Input_1.Input label="Username" value={username} onChangeText={setUsername} placeholder="Enter your username"/>
                        <Input_1.Input label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry/>
                        <Button_1.Button title="Log In" onPress={handleLogin} loading={loading}/>
                    </react_native_1.View>

                    <react_native_1.View style={styles.footer}>
                        <react_native_1.Text style={styles.footerText}>Don't have an account? </react_native_1.Text>
                        <react_native_1.Text style={styles.footerLink} onPress={function () { return navigation.navigate('Register'); }}>
                            Sign Up
                        </react_native_1.Text>
                    </react_native_1.View>
                </react_native_1.View>
            </react_native_1.ScrollView>
        </react_native_1.KeyboardAvoidingView>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        container: {
            flex: 1,
            height: '100%',
            backgroundColor: colors.bg,
        },
        scrollContent: {
            flexGrow: 1,
            justifyContent: 'center',
        },
        content: {
            justifyContent: 'center',
            paddingHorizontal: 32,
        },
        logoContainer: {
            alignItems: 'center',
            marginBottom: 0,
        },
        logoCircle: {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
        },
        logoText: {
            color: '#FFFFFF',
            fontSize: 36,
            fontWeight: '700',
        },
        title: {
            fontSize: 32,
            fontWeight: '800',
            color: colors.dark,
            marginBottom: 4,
        },
        subtitle: {
            fontSize: 15,
            color: colors.gray400,
        },
        form: {
            marginBottom: 24,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        },
        footerText: {
            color: colors.gray500,
            fontSize: 14,
        },
        footerLink: {
            color: colors.primary,
            fontSize: 14,
            fontWeight: '600',
        },
    });
}
