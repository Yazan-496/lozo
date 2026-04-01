"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagePreviewScreen = ImagePreviewScreen;
var react_native_1 = require("react-native");
var theme_1 = require("../../../shared/utils/theme");
function ImagePreviewScreen(_a) {
    var visible = _a.visible, uri = _a.uri, onSend = _a.onSend, onCancel = _a.onCancel, isSending = _a.isSending;
    return (<react_native_1.Modal visible={visible} animationType="slide" transparent={false}>
            <react_native_1.View style={styles.container}>
                {uri && (<react_native_1.Image source={{ uri: uri }} style={styles.image} resizeMode="contain"/>)}
                <react_native_1.View style={styles.bottomBar}>
                    <react_native_1.TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isSending}>
                        <react_native_1.Text style={styles.cancelText}>Cancel</react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                    <react_native_1.TouchableOpacity style={[styles.sendBtn, isSending && styles.sendBtnDisabled]} onPress={onSend} disabled={isSending}>
                        {isSending ? (<react_native_1.ActivityIndicator color={theme_1.lightColors.white} size="small"/>) : (<react_native_1.Text style={styles.sendText}>Send</react_native_1.Text>)}
                    </react_native_1.TouchableOpacity>
                </react_native_1.View>
            </react_native_1.View>
        </react_native_1.Modal>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    image: {
        flex: 1,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingBottom: 40,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    cancelText: {
        color: theme_1.lightColors.white,
        fontSize: 16,
        fontWeight: '500',
    },
    sendBtn: {
        backgroundColor: theme_1.lightColors.primary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 24,
        minWidth: 100,
        alignItems: 'center',
    },
    sendBtnDisabled: {
        opacity: 0.6,
    },
    sendText: {
        color: theme_1.lightColors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
