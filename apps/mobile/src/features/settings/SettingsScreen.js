"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsScreen = SettingsScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var vector_icons_1 = require("@expo/vector-icons");
var theme_1 = require("../../shared/stores/theme");
var useThemeColors_1 = require("../../shared/hooks/useThemeColors");
var THEME_OPTIONS = [
    { label: 'Light', value: 'light', icon: 'sunny-outline', description: 'Always use light mode' },
    { label: 'Dark', value: 'dark', icon: 'moon-outline', description: 'Always use dark mode' },
    { label: 'System', value: 'system', icon: 'phone-portrait-outline', description: 'Follow device setting' },
];
function SettingsScreen() {
    var _a = (0, theme_1.useThemeStore)(), mode = _a.mode, setMode = _a.setMode;
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    return (<react_native_1.ScrollView style={styles.container}>
      <react_native_1.Text style={styles.sectionHeader}>Appearance</react_native_1.Text>

      <react_native_1.View style={styles.card}>
        {THEME_OPTIONS.map(function (opt, i) { return (<react_native_1.TouchableOpacity key={opt.value} style={[styles.option, i < THEME_OPTIONS.length - 1 && styles.optionBorder]} onPress={function () { return setMode(opt.value); }} activeOpacity={0.6}>
            <react_native_1.View style={[styles.iconWrap, mode === opt.value && styles.iconWrapActive]}>
              <vector_icons_1.Ionicons name={opt.icon} size={20} color={mode === opt.value ? '#FFFFFF' : colors.gray500}/>
            </react_native_1.View>
            <react_native_1.View style={styles.optionInfo}>
              <react_native_1.Text style={styles.optionLabel}>{opt.label}</react_native_1.Text>
              <react_native_1.Text style={styles.optionDesc}>{opt.description}</react_native_1.Text>
            </react_native_1.View>
            {mode === opt.value && (<vector_icons_1.Ionicons name="checkmark-circle" size={22} color={colors.primary}/>)}
          </react_native_1.TouchableOpacity>); })}
      </react_native_1.View>
    </react_native_1.ScrollView>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.bgSecondary,
        },
        sectionHeader: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.gray400,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 8,
        },
        card: {
            backgroundColor: colors.bg,
            marginHorizontal: 16,
            borderRadius: 14,
            overflow: 'hidden',
        },
        option: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
        },
        optionBorder: {
            borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        iconWrap: {
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.gray100,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
        },
        iconWrapActive: {
            backgroundColor: colors.primary,
        },
        optionInfo: {
            flex: 1,
        },
        optionLabel: {
            fontSize: 16,
            fontWeight: '500',
            color: colors.dark,
        },
        optionDesc: {
            fontSize: 13,
            color: colors.gray400,
            marginTop: 1,
        },
    });
}
