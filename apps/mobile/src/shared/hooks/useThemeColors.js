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
exports.useThemeColors = useThemeColors;
var react_native_1 = require("react-native");
var theme_1 = require("../stores/theme");
var theme_2 = require("../utils/theme");
function useThemeColors() {
    var colorScheme = (0, react_native_1.useColorScheme)();
    var mode = (0, theme_1.useThemeStore)(function (s) { return s.mode; });
    var isDark = mode === 'dark' || (mode === 'system' && colorScheme === 'dark');
    return __assign(__assign({}, (isDark ? theme_2.darkColors : theme_2.lightColors)), { isDark: isDark });
}
