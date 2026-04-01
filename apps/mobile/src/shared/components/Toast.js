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
exports.toastRef = exports.useToast = void 0;
exports.ToastProvider = ToastProvider;
var react_1 = __importStar(require("react"));
var react_native_1 = require("react-native");
var react_native_safe_area_context_1 = require("react-native-safe-area-context");
var theme_1 = require("../utils/theme");
var ToastContext = (0, react_1.createContext)(undefined);
var useToast = function () {
    var context = (0, react_1.useContext)(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};
exports.useToast = useToast;
exports.toastRef = react_1.default.createRef();
function ToastProvider(_a) {
    var children = _a.children;
    var insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    var _b = (0, react_1.useState)({ visible: false, type: 'info', message: '', id: 0 }), toast = _b[0], setToast = _b[1];
    var translateY = (0, react_1.useRef)(new react_native_1.Animated.Value(-100)).current;
    var dismissTimeoutRef = (0, react_1.useRef)(null);
    var nextIdRef = (0, react_1.useRef)(0);
    var showToast = function (type, message) {
        // Cancel previous dismiss timeout
        if (dismissTimeoutRef.current) {
            clearTimeout(dismissTimeoutRef.current);
        }
        var id = nextIdRef.current++;
        setToast({ visible: true, type: type, message: message, id: id });
        // Animate in
        react_native_1.Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
        // Auto-dismiss after 3 seconds
        dismissTimeoutRef.current = setTimeout(function () {
            dismissToast();
        }, 3000);
    };
    var dismissToast = function () {
        react_native_1.Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
        }).start(function () {
            setToast({ visible: false, type: 'info', message: '', id: 0 });
        });
    };
    // Setup PanResponder for swipe-up dismiss
    var panResponder = (0, react_1.useRef)(react_native_1.PanResponder.create({
        onStartShouldSetPanResponder: function () { return toast.visible; },
        onMoveShouldSetPanResponder: function (_, _a) {
            var dy = _a.dy;
            return toast.visible && dy < -10;
        },
        onPanResponderRelease: function (_, _a) {
            var dy = _a.dy, vy = _a.vy;
            if (dy < -20 || vy < -0.5) {
                dismissToast();
            }
        },
    })).current;
    // Expose showToast on ref
    (0, react_1.useEffect)(function () {
        if (exports.toastRef.current) {
            exports.toastRef.current.showToast = showToast;
        }
    }, []);
    var getBackgroundColor = function () {
        switch (toast.type) {
            case 'error':
                return theme_1.lightColors.red;
            case 'success':
                return theme_1.lightColors.green;
            case 'info':
                return theme_1.lightColors.primary;
        }
    };
    return (<ToastContext.Provider value={{ showToast: showToast }}>
      {children}
      {toast.visible && (<react_native_1.Animated.View style={[
                styles.toastContainer,
                {
                    transform: [{ translateY: translateY }],
                },
            ]} {...panResponder.panHandlers}>
          <react_native_1.View style={[styles.safeArea, { paddingTop: insets.top || 12 }]}>
            <react_native_1.View style={[styles.toast, { backgroundColor: getBackgroundColor() }]}>
              <react_native_1.Text style={styles.message}>{toast.message}</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.Animated.View>)}
    </ToastContext.Provider>);
}
var styles = react_native_1.StyleSheet.create({
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
        color: theme_1.lightColors.white,
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});
