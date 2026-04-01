"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmojiPickerModal = EmojiPickerModal;
var react_1 = require("react");
var react_native_1 = require("react-native");
var theme_1 = require("../../../shared/utils/theme");
// ~48 emojis across 4 categories
var EMOJI_DATA = [
    // Smileys
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '😉',
    '😍',
    '🤩',
    '😘',
    '😗',
    // Gestures
    '👍',
    '👎',
    '👏',
    '🙌',
    '🤝',
    '🤜',
    '✌️',
    '🤞',
    '👌',
    '🤌',
    '🫶',
    '❤️',
    '🧡',
    '💛',
    '💚',
    // Expressions
    '😮',
    '😢',
    '😡',
    '😱',
    '🥲',
    '😤',
    '🫡',
    '🥳',
    '😴',
    '🤔',
    '🤫',
    '🤭',
    '😬',
    '😏',
    '🙄',
    // Objects/symbols
    '🔥',
    '⭐',
    '💯',
    '✅',
    '❌',
    '🎉',
    '🎊',
    '💪',
    '🚀',
    '👀',
    '💀',
    '🫠',
    '🤯',
    '💥',
];
var NUM_COLS = 6;
var _a = react_native_1.Dimensions.get('window'), screenHeight = _a.height, screenWidth = _a.width;
function EmojiPickerModal(_a) {
    var visible = _a.visible, currentUserEmoji = _a.currentUserEmoji, onReact = _a.onReact, onClose = _a.onClose;
    var slideAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(screenHeight * 0.6)).current;
    (0, react_1.useEffect)(function () {
        if (visible) {
            react_native_1.Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 12,
            }).start();
        }
        else {
            slideAnim.setValue(screenHeight * 0.6);
        }
    }, [visible]);
    return (<react_native_1.Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            {/* Static backdrop covering top 40% — tapping closes the picker */}
            <react_native_1.TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}/>
            {/* Sheet slides up independently */}
            <react_native_1.Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                {/* Drag handle */}
                <react_native_1.View style={styles.handle}/>
                <react_native_1.FlatList data={EMOJI_DATA} keyExtractor={function (item) { return item; }} numColumns={NUM_COLS} renderItem={function (_a) {
            var item = _a.item;
            return (<react_native_1.TouchableOpacity style={[
                    styles.emojiCell,
                    currentUserEmoji === item && styles.emojiCellActive,
                ]} onPress={function () { return onReact(item); }}>
                            <react_native_1.Text style={styles.emojiText}>{item}</react_native_1.Text>
                        </react_native_1.TouchableOpacity>);
        }} showsVerticalScrollIndicator={false}/>
            </react_native_1.Animated.View>
        </react_native_1.Modal>);
}
var cellSize = screenWidth / NUM_COLS;
var styles = react_native_1.StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: screenHeight * 0.4,
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: screenHeight * 0.6,
        backgroundColor: theme_1.lightColors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: theme_1.lightColors.gray300,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    emojiCell: {
        width: cellSize,
        height: cellSize,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiCellActive: {
        backgroundColor: theme_1.lightColors.primary + '25',
    },
    emojiText: {
        fontSize: 32,
    },
});
