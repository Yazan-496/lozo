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
Object.defineProperty(exports, "__esModule", { value: true });
exports.inAppNotifRef = void 0;
exports.useInAppNotification = useInAppNotification;
exports.InAppNotificationProvider = InAppNotificationProvider;
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var react_native_safe_area_context_1 = require("react-native-safe-area-context");
var Avatar_1 = require("./Avatar");
var useThemeColors_1 = require("../hooks/useThemeColors");
exports.inAppNotifRef = { current: null };
var InAppNotifContext = (0, react_1.createContext)(undefined);
function useInAppNotification() {
    var ctx = (0, react_1.useContext)(InAppNotifContext);
    if (!ctx)
        throw new Error('useInAppNotification must be used within InAppNotificationProvider');
    return ctx;
}
// Module-level show function wired to the provider's state setter
// (set by the provider after mount via the ref)
function InAppNotificationProvider(_a) {
    var _b, _c, _d;
    var children = _a.children;
    var insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    var colors = (0, useThemeColors_1.useThemeColors)();
    var _e = (0, react_1.useState)(false), visible = _e[0], setVisible = _e[1];
    var _f = (0, react_1.useState)(null), payload = _f[0], setPayload = _f[1];
    var translateY = (0, react_1.useRef)(new react_native_1.Animated.Value(-120)).current;
    var dismissTimeout = (0, react_1.useRef)(null);
    // Navigation is accessed via dynamic import to avoid circular deps
    var _g = (0, react_1.useState)(null), onTapNav = _g[0], setOnTapNav = _g[1];
    var dismiss = (0, react_1.useCallback)(function () {
        react_native_1.Animated.timing(translateY, {
            toValue: -120,
            duration: 220,
            useNativeDriver: true,
        }).start(function () { return setVisible(false); });
    }, [translateY]);
    var show = (0, react_1.useCallback)(function (p) {
        if (dismissTimeout.current)
            clearTimeout(dismissTimeout.current);
        setPayload(p);
        setVisible(true);
        // Build tap handler based on type
        if (p.type === 'message' && p.conversationId) {
            var convId_1 = p.conversationId;
            setOnTapNav(function () { return function () {
                Promise.resolve().then(function () { return __importStar(require('../../navigation/navigationRef')); }).then(function (_a) {
                    var navigationRef = _a.navigationRef;
                    if (navigationRef.isReady()) {
                        navigationRef.navigate('Chat', { conversationId: convId_1 });
                    }
                });
                dismiss();
            }; });
        }
        else {
            setOnTapNav(function () { return function () {
                Promise.resolve().then(function () { return __importStar(require('../../navigation/navigationRef')); }).then(function (_a) {
                    var navigationRef = _a.navigationRef;
                    if (navigationRef.isReady()) {
                        navigationRef.navigate('Home');
                    }
                });
                dismiss();
            }; });
        }
        react_native_1.Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
        }).start();
        dismissTimeout.current = setTimeout(dismiss, 4000);
    }, [translateY, dismiss]);
    // Expose via module-level ref so socket.ts can call it outside React
    react_1.default.useEffect(function () {
        exports.inAppNotifRef.current = { show: show };
        return function () { exports.inAppNotifRef.current = null; };
    }, [show]);
    var panResponder = react_native_1.PanResponder.create({
        onMoveShouldSetPanResponder: function (_, g) { return Math.abs(g.dy) > 5; },
        onPanResponderMove: function (_, g) {
            if (g.dy < 0)
                translateY.setValue(g.dy);
        },
        onPanResponderRelease: function (_, g) {
            if (g.dy < -30) {
                dismiss();
            }
            else {
                react_native_1.Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
            }
        },
    });
    var senderName = (_b = payload === null || payload === void 0 ? void 0 : payload.senderName) !== null && _b !== void 0 ? _b : 'Someone';
    var avatarColor = (_c = payload === null || payload === void 0 ? void 0 : payload.senderAvatarColor) !== null && _c !== void 0 ? _c : '#0084FF';
    return (<InAppNotifContext.Provider value={{ showNotification: show }}>
      {children}
      {visible && payload && (<react_native_1.Animated.View style={[
                styles.container,
                {
                    top: insets.top + 8,
                    backgroundColor: colors.bg,
                    shadowColor: colors.dark,
                    transform: [{ translateY: translateY }],
                },
            ]} {...panResponder.panHandlers}>
          <react_native_1.TouchableOpacity activeOpacity={0.92} onPress={function () { return onTapNav === null || onTapNav === void 0 ? void 0 : onTapNav(); }} style={styles.inner}>
            <Avatar_1.Avatar uri={(_d = payload.senderAvatarUrl) !== null && _d !== void 0 ? _d : null} name={senderName} color={avatarColor} size={44}/>
            <react_native_1.View style={styles.text}>
              <react_native_1.Text style={[styles.name, { color: colors.dark }]} numberOfLines={1}>
                {senderName}
              </react_native_1.Text>
              <react_native_1.Text style={[styles.preview, { color: colors.gray500 }]} numberOfLines={2}>
                {payload.preview}
              </react_native_1.Text>
            </react_native_1.View>
          </react_native_1.TouchableOpacity>
        </react_native_1.Animated.View>)}
    </InAppNotifContext.Provider>);
}
var styles = react_native_1.StyleSheet.create({
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
