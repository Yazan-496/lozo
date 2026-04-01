"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypingIndicator = TypingIndicator;
var react_1 = require("react");
var react_native_1 = require("react-native");
var useThemeColors_1 = require("../../../shared/hooks/useThemeColors");
var DOT_SIZE = 8;
var STAGGER = 150;
var HALF_DURATION = 200;
function TypingIndicator() {
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    var dot0 = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    var dot1 = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    var dot2 = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    var dots = [dot0, dot1, dot2];
    (0, react_1.useEffect)(function () {
        var animations = dots.map(function (dot, i) {
            return react_native_1.Animated.loop(react_native_1.Animated.sequence([
                react_native_1.Animated.delay(i * STAGGER),
                react_native_1.Animated.timing(dot, { toValue: 1.5, duration: HALF_DURATION, useNativeDriver: true }),
                react_native_1.Animated.timing(dot, { toValue: 1.0, duration: HALF_DURATION, useNativeDriver: true }),
            ]));
        });
        animations.forEach(function (a) { return a.start(); });
        return function () { return animations.forEach(function (a) { return a.stop(); }); };
    }, []);
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.bubble}>
        {dots.map(function (dot, i) { return (<react_native_1.Animated.View key={i} style={[styles.dot, { transform: [{ scale: dot }] }]}/>); })}
      </react_native_1.View>
    </react_native_1.View>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        container: { paddingHorizontal: 16, paddingVertical: 4, alignItems: 'flex-start' },
        bubble: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.gray100,
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 12,
            gap: 5,
        },
        dot: {
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: colors.gray400,
        },
    });
}
