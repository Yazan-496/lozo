"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplyPreviewBar = ReplyPreviewBar;
var react_1 = require("react");
var react_native_1 = require("react-native");
var useThemeColors_1 = require("../../../shared/hooks/useThemeColors");
function ReplyPreviewBar(_a) {
    var _b, _c, _d;
    var replyingTo = _a.replyingTo, senderName = _a.senderName, onCancel = _a.onCancel;
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    var preview = replyingTo.deletedForEveryone
        ? 'Message deleted'
        : ((_b = replyingTo.content) !== null && _b !== void 0 ? _b : '').slice(0, 50) + (((_d = (_c = replyingTo.content) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) > 50 ? '…' : '');
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={styles.senderName}>{senderName}</react_native_1.Text>
        <react_native_1.Text style={styles.contentText} numberOfLines={1}>{preview}</react_native_1.Text>
      </react_native_1.View>
      <react_native_1.TouchableOpacity onPress={onCancel} style={styles.closeButton}>
        <react_native_1.Text style={styles.closeIcon}>×</react_native_1.Text>
      </react_native_1.TouchableOpacity>
    </react_native_1.View>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 52,
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingHorizontal: 12,
        },
        content: {
            flex: 1,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
            paddingLeft: 8,
        },
        senderName: { fontSize: 12, fontWeight: '600', color: colors.dark, marginBottom: 2 },
        contentText: { fontSize: 12, color: colors.gray500 },
        closeButton: { marginLeft: 8, padding: 4 },
        closeIcon: { fontSize: 24, color: colors.gray400 },
    });
}
