"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = exports.darkColors = exports.lightColors = void 0;
exports.lightColors = {
    primary: '#0084FF',
    primaryDark: '#0077E6',
    white: '#FFFFFF',
    black: '#000000',
    dark: '#1C1E21',
    bg: '#FFFFFF',
    bgSecondary: '#F0F2F5',
    gray50: '#F0F2F5',
    gray100: '#E4E6EB',
    gray200: '#D8DADF',
    gray300: '#BCC0C4',
    gray400: '#8A8D91',
    gray500: '#65676B',
    gray600: '#444950',
    gray700: '#303338',
    gray800: '#242526',
    gray900: '#18191A',
    green: '#4CAF50',
    red: '#F44336',
    border: '#E4E6EB',
};
exports.darkColors = {
    primary: '#0084FF',
    primaryDark: '#0077E6',
    white: '#18191A',
    black: '#E4E6EB',
    dark: '#E4E6EB',
    bg: '#18191A',
    bgSecondary: '#242526',
    gray50: '#242526',
    gray100: '#3A3B3C',
    gray200: '#3E4042',
    gray300: '#4E4F50',
    gray400: '#B0B3B8',
    gray500: '#D8DADF',
    gray600: '#E4E6EB',
    gray700: '#F0F2F5',
    gray800: '#F0F2F5',
    gray900: '#F5F6F7',
    green: '#4CAF50',
    red: '#F44336',
    border: '#3E4042',
};
// Static default for legacy imports — screens should use useThemeColors() instead
exports.colors = exports.lightColors;
