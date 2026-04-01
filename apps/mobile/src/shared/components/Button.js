"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = Button;
var react_native_1 = require("react-native");
var useThemeColors_1 = require("../hooks/useThemeColors");
function Button(_a) {
    var title = _a.title, onPress = _a.onPress, _b = _a.variant, variant = _b === void 0 ? 'primary' : _b, _c = _a.loading, loading = _c === void 0 ? false : _c, _d = _a.disabled, disabled = _d === void 0 ? false : _d, _e = _a.size, size = _e === void 0 ? 'large' : _e;
    var colors = (0, useThemeColors_1.useThemeColors)();
    var bgColor = {
        primary: colors.primary,
        secondary: colors.gray100,
        ghost: 'transparent',
    }[variant];
    var textColor = {
        primary: '#FFFFFF',
        secondary: colors.dark,
        ghost: colors.primary,
    }[variant];
    var paddingVertical = { small: 8, medium: 12, large: 14 }[size];
    return (<react_native_1.TouchableOpacity style={[
            styles.button,
            { backgroundColor: bgColor, paddingVertical: paddingVertical, opacity: disabled || loading ? 0.5 : 1 },
        ]} onPress={onPress} disabled={disabled || loading} activeOpacity={0.7}>
      {loading ? (<react_native_1.ActivityIndicator color={textColor} size="small"/>) : (<react_native_1.Text style={[styles.text, { color: textColor }]}>{title}</react_native_1.Text>)}
    </react_native_1.TouchableOpacity>);
}
var styles = react_native_1.StyleSheet.create({
    button: {
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        marginVertical: 6,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
});
