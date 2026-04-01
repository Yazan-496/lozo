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
exports.canEdit = canEdit;
exports.canDeleteForEveryone = canDeleteForEveryone;
exports.MessageActionMenu = MessageActionMenu;
var react_1 = require("react");
var react_native_1 = require("react-native");
var useThemeColors_1 = require("../../../shared/hooks/useThemeColors");
var QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
function canEdit(message, currentUserId) {
    return (message.senderId === currentUserId &&
        message.type === 'text' &&
        Date.now() - new Date(message.createdAt).getTime() < 15 * 60 * 1000);
}
function canDeleteForEveryone(message, currentUserId) {
    return (message.senderId === currentUserId &&
        Date.now() - new Date(message.createdAt).getTime() < 60 * 60 * 1000);
}
function MessageActionMenu(_a) {
    var message = _a.message, currentUserId = _a.currentUserId, visible = _a.visible, messageY = _a.messageY, currentUserEmoji = _a.currentUserEmoji, onClose = _a.onClose, onReact = _a.onReact, onOpenEmojiPicker = _a.onOpenEmojiPicker, onReply = _a.onReply, onCopy = _a.onCopy, onForward = _a.onForward, onEdit = _a.onEdit, onDeleteForMe = _a.onDeleteForMe, onDeleteForEveryone = _a.onDeleteForEveryone, onDetails = _a.onDetails;
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    var scaleAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0.85)).current;
    var opacityAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    var screenHeight = react_native_1.Dimensions.get('window').height;
    var isAbove = messageY > screenHeight / 2;
    var isMe = message.senderId === currentUserId;
    (0, react_1.useEffect)(function () {
        if (visible) {
            scaleAnim.setValue(0.85);
            opacityAnim.setValue(0);
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
                react_native_1.Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            ]).start();
        }
    }, [visible, scaleAnim, opacityAnim]);
    var canEditMsg = canEdit(message, currentUserId);
    var canDeleteForEveryoneMsg = canDeleteForEveryone(message, currentUserId);
    var canCopy = message.type === 'text' && message.content !== null;
    return (<react_native_1.Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <react_native_1.TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}/>

      <react_native_1.Animated.View style={[
            styles.card,
            isMe ? styles.cardRight : styles.cardLeft,
            __assign({ transform: [{ scale: scaleAnim }], opacity: opacityAnim }, (isAbove
                ? { bottom: screenHeight - messageY + 8 }
                : { top: messageY + 8 })),
        ]}>
        {/* Emoji reaction row */}
        <react_native_1.View style={styles.emojiRow}>
          {QUICK_EMOJIS.map(function (emoji) { return (<react_native_1.TouchableOpacity key={emoji} style={[styles.emojiBtn, currentUserEmoji === emoji && styles.emojiBtnActive]} onPress={function () { return onReact(emoji); }}>
              <react_native_1.Text style={styles.emojiText}>{emoji}</react_native_1.Text>
            </react_native_1.TouchableOpacity>); })}
          <react_native_1.TouchableOpacity style={styles.emojiBtn} onPress={onOpenEmojiPicker}>
            <react_native_1.Text style={styles.moreBtnText}>+</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        <react_native_1.View style={styles.divider}/>

        <react_native_1.TouchableOpacity style={styles.actionRow} onPress={onReply}>
          <react_native_1.Text style={styles.actionLabel}>Reply</react_native_1.Text>
        </react_native_1.TouchableOpacity>

        {canCopy && (<react_native_1.TouchableOpacity style={styles.actionRow} onPress={onCopy}>
            <react_native_1.Text style={styles.actionLabel}>Copy</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}

        <react_native_1.TouchableOpacity style={styles.actionRow} onPress={onForward}>
          <react_native_1.Text style={styles.actionLabel}>Forward</react_native_1.Text>
        </react_native_1.TouchableOpacity>

        {canEditMsg && (<react_native_1.TouchableOpacity style={styles.actionRow} onPress={onEdit}>
            <react_native_1.Text style={styles.actionLabel}>Edit</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}

        <react_native_1.TouchableOpacity style={styles.actionRow} onPress={onDetails}>
          <react_native_1.Text style={styles.actionLabel}>Details</react_native_1.Text>
        </react_native_1.TouchableOpacity>

        {(isMe || canDeleteForEveryoneMsg) && <react_native_1.View style={styles.divider}/>}

        {isMe && (<react_native_1.TouchableOpacity style={styles.actionRow} onPress={onDeleteForMe}>
            <react_native_1.Text style={[styles.actionLabel, styles.destructive]}>Delete for me</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}

        {canDeleteForEveryoneMsg && (<react_native_1.TouchableOpacity style={styles.actionRow} onPress={onDeleteForEveryone}>
            <react_native_1.Text style={[styles.actionLabel, styles.destructive]}>Delete for everyone</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}
      </react_native_1.Animated.View>
    </react_native_1.Modal>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        backdrop: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        card: {
            position: 'absolute',
            backgroundColor: colors.white,
            borderRadius: 12,
            minWidth: 200,
            overflow: 'hidden',
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
        },
        cardRight: {
            right: 16,
        },
        cardLeft: {
            left: 16,
        },
        // Emoji row
        emojiRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 8,
        },
        emojiBtn: {
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            marginHorizontal: 1,
        },
        emojiBtnActive: {
            backgroundColor: colors.primary + '25',
            borderWidth: 1,
            borderColor: colors.primary,
        },
        emojiText: {
            fontSize: 22,
        },
        moreBtnText: {
            fontSize: 18,
            color: colors.gray400,
            fontWeight: '600',
        },
        // Action rows
        divider: {
            height: react_native_1.StyleSheet.hairlineWidth,
            backgroundColor: colors.gray100,
            marginHorizontal: 12,
        },
        actionRow: {
            paddingHorizontal: 20,
            paddingVertical: 13,
        },
        actionLabel: {
            fontSize: 15,
            color: colors.dark,
        },
        destructive: {
            color: colors.red,
        },
    });
}
