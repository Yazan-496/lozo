"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.default = App;
var react_1 = require("react");
var react_native_1 = require("react-native");
var expo_status_bar_1 = require("expo-status-bar");
var react_native_gesture_handler_1 = require("react-native-gesture-handler");
var react_native_safe_area_context_1 = require("react-native-safe-area-context");
var Network = __importStar(require("expo-network"));
var navigation_1 = require("./src/navigation");
var SplashView_1 = require("./src/shared/components/SplashView");
var auth_1 = require("./src/shared/stores/auth");
var theme_1 = require("./src/shared/stores/theme");
var network_1 = require("./src/shared/stores/network");
var socket_1 = require("./src/shared/services/socket");
var ErrorBoundary_1 = require("./src/shared/components/ErrorBoundary");
var Toast_1 = require("./src/shared/components/Toast");
var InAppNotification_1 = require("./src/shared/components/InAppNotification");
var sqlite_1 = require("./src/shared/db/sqlite");
var messages_db_ts_1 = require("./src/shared/db/messages.db.ts");
var useNetworkState_1 = require("./src/shared/hooks/useNetworkState");
function App() {
    var _this = this;
    var hydrate = (0, auth_1.useAuthStore)(function (s) { return s.hydrate; });
    var hydrateTheme = (0, theme_1.useThemeStore)(function (s) { return s.hydrate; });
    var isAuthenticated = (0, auth_1.useAuthStore)(function (s) { return s.isAuthenticated; });
    var isLoading = (0, auth_1.useAuthStore)(function (s) { return s.isLoading; });
    var themeMode = (0, theme_1.useThemeStore)(function (s) { return s.mode; });
    var systemScheme = (0, react_native_1.useColorScheme)();
    var _a = (0, react_1.useState)(true), splashMounted = _a[0], setSplashMounted = _a[1];
    var _b = (0, react_1.useState)(true), splashVisible = _b[0], setSplashVisible = _b[1];
    var _c = (0, react_1.useState)(false), minTimeElapsed = _c[0], setMinTimeElapsed = _c[1];
    // Initialize network state monitoring
    (0, useNetworkState_1.useNetworkState)();
    (0, react_1.useEffect)(function () {
        var initApp = function () { return __awaiter(_this, void 0, void 0, function () {
            var netState;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Initialize SQLite database
                    return [4 /*yield*/, (0, sqlite_1.initDatabase)()];
                    case 1:
                        // Initialize SQLite database
                        _a.sent();
                        return [4 /*yield*/, Network.getNetworkStateAsync()];
                    case 2:
                        netState = _a.sent();
                        network_1.useNetworkStore.getState().setOnline(!!netState.isInternetReachable);
                        // Run pruning in background after short delay
                        setTimeout(function () { return void (0, messages_db_ts_1.pruneOldMessages)(); }, 2000);
                        return [2 /*return*/];
                }
            });
        }); };
        void initApp();
        void hydrate();
        void hydrateTheme();
        var timer = setTimeout(function () {
            setMinTimeElapsed(true);
        }, 1500);
        return function () { return clearTimeout(timer); };
    }, []);
    (0, react_1.useEffect)(function () {
        if (minTimeElapsed && !isLoading) {
            setSplashVisible(false);
        }
    }, [minTimeElapsed, isLoading]);
    (0, react_1.useEffect)(function () {
        if (isAuthenticated) {
            (0, socket_1.connectSocket)();
        }
        else {
            (0, socket_1.disconnectSocket)();
        }
    }, [isAuthenticated]);
    var isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
    return (<ErrorBoundary_1.ErrorBoundary>
            <react_native_safe_area_context_1.SafeAreaProvider>
                <Toast_1.ToastProvider>
                    <InAppNotification_1.InAppNotificationProvider>
                    <react_native_gesture_handler_1.GestureHandlerRootView style={{ flex: 1 }}>
                        <expo_status_bar_1.StatusBar style={isDark ? 'light' : 'dark'}/>
                        {splashMounted && (<SplashView_1.SplashView visible={splashVisible} onHide={function () { return setSplashMounted(false); }}/>)}
                        <navigation_1.RootNavigation />
                    </react_native_gesture_handler_1.GestureHandlerRootView>
                    </InAppNotification_1.InAppNotificationProvider>
                </Toast_1.ToastProvider>
            </react_native_safe_area_context_1.SafeAreaProvider>
        </ErrorBoundary_1.ErrorBoundary>);
}
