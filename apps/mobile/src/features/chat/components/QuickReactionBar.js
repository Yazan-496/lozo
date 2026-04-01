"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickReactionBar = QuickReactionBar;
var react_1 = require("react");
var react_native_1 = require("react-native");
var theme_1 = require("../../../shared/utils/theme");
var QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
var screenHeight = react_native_1.Dimensions.get('window').height;
function QuickReactionBar(_a) {
    var visible = _a.visible, messageId = _a.messageId, messageY = _a.messageY, currentUserEmoji = _a.currentUserEmoji, onReact = _a.onReact, onClose = _a.onClose;
    var scaleAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    var opacityAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    var isAbove = messageY > screenHeight / 2;
    (0, react_1.useEffect)(function () {
        if (visible) {
            react_native_1.Animated.parallel([
                react_native_1.Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 150,
                    friction: 8,
                }),
                react_native_1.Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 120,
                    useNativeDriver: true,
                }),
            ]).start();
        }
        else {
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
        }
    }, [visible]);
    var positionStyle = isAbove
        ? { bottom: screenHeight - messageY + 8 }
        : { top: messageY + 8 };
    return (<react_native_1.Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <react_native_1.TouchableOpacity style={react_native_1.StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}/>
            <react_native_1.Animated.View style={[
            styles.bar,
            positionStyle,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}>
                {QUICK_EMOJIS.map(function (emoji) { return (<react_native_1.TouchableOpacity key={emoji} style={[
                styles.emojiBtn,
                currentUserEmoji === emoji && styles.emojiBtnActive,
            ]} onPress={function () { return onReact(emoji); }}>
                        <react_native_1.Text style={styles.emojiText}>{emoji}</react_native_1.Text>
                    </react_native_1.TouchableOpacity>); })}
            </react_native_1.Animated.View>
        </react_native_1.Modal>);
}
var styles = react_native_1.StyleSheet.create({
    bar: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        backgroundColor: theme_1.lightColors.white,
        borderRadius: 28,
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    emojiBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        marginHorizontal: 2,
    },
    emojiBtnActive: {
        backgroundColor: theme_1.lightColors.primary + '25',
        borderWidth: 1,
        borderColor: theme_1.lightColors.primary,
    },
    emojiText: {
        fontSize: 24,
    },
});
