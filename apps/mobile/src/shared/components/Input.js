"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = Input;
var react_1 = require("react");
var react_native_1 = require("react-native");
var useThemeColors_1 = require("../hooks/useThemeColors");
function Input(_a) {
    var value = _a.value, onChangeText = _a.onChangeText, placeholder = _a.placeholder, label = _a.label, secureTextEntry = _a.secureTextEntry, _b = _a.autoCapitalize, autoCapitalize = _b === void 0 ? 'none' : _b, error = _a.error, multiline = _a.multiline;
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    return (<react_native_1.View style={styles.container}>
      {label && <react_native_1.Text style={styles.label}>{label}</react_native_1.Text>}
      <react_native_1.TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize} multiline={multiline} style={[styles.input, error ? styles.inputError : null]} placeholderTextColor={colors.gray400}/>
      {error && <react_native_1.Text style={styles.error}>{error}</react_native_1.Text>}
    </react_native_1.View>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        container: { marginBottom: 16 },
        label: {
            color: colors.gray500,
            fontSize: 13,
            marginBottom: 6,
            marginLeft: 4,
            fontWeight: '500',
        },
        input: {
            backgroundColor: colors.gray50,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 12,
            fontSize: 16,
            color: colors.dark,
            borderWidth: 1,
            borderColor: 'transparent',
        },
        inputError: { borderColor: colors.red },
        error: { color: colors.red, fontSize: 12, marginTop: 4, marginLeft: 4 },
    });
}
