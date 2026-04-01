"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var vector_icons_1 = require("@expo/vector-icons");
var theme_1 = require("../utils/theme");
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        _this.handleRetry = function () {
            _this.setState({ hasError: false, error: null });
        };
        _this.state = { hasError: false, error: null };
        return _this;
    }
    ErrorBoundary.getDerivedStateFromError = function (error) {
        return { hasError: true, error: error };
    };
    ErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        console.error('Caught error:', error, errorInfo);
    };
    ErrorBoundary.prototype.render = function () {
        if (this.state.hasError) {
            return (<react_native_1.View style={styles.container}>
          <vector_icons_1.Ionicons name="warning" size={64} color={theme_1.lightColors.red} style={styles.icon}/>
          <react_native_1.Text style={styles.title}>Something went wrong</react_native_1.Text>
          <react_native_1.Text style={styles.message}>We encountered an unexpected error. Please try again.</react_native_1.Text>
          <react_native_1.TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <react_native_1.Text style={styles.buttonText}>Try Again</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>);
        }
        return this.props.children;
    };
    return ErrorBoundary;
}(react_1.default.Component));
exports.ErrorBoundary = ErrorBoundary;
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme_1.lightColors.white,
        paddingHorizontal: 24,
    },
    icon: {
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme_1.lightColors.dark,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: theme_1.lightColors.gray500,
        marginBottom: 32,
        textAlign: 'center',
    },
    button: {
        backgroundColor: theme_1.lightColors.primary,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: theme_1.lightColors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
