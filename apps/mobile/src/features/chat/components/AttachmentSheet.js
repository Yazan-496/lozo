"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentSheet = AttachmentSheet;
var react_1 = require("react");
var react_native_1 = require("react-native");
var vector_icons_1 = require("@expo/vector-icons");
var useThemeColors_1 = require("../../../shared/hooks/useThemeColors");
var OPTIONS = [
    { label: 'Gallery', icon: 'images-outline', action: 'gallery' },
    { label: 'Camera', icon: 'camera-outline', action: 'camera' },
    { label: 'File', icon: 'document-outline', action: 'file' },
];
function AttachmentSheet(_a) {
    var visible = _a.visible, onClose = _a.onClose, onGallery = _a.onGallery, onCamera = _a.onCamera, onFile = _a.onFile;
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    var slideAnim = (0, react_1.useRef)(new react_native_1.Animated.Value(300)).current;
    (0, react_1.useEffect)(function () {
        if (visible) {
            react_native_1.Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
        }
        else {
            slideAnim.setValue(300);
        }
    }, [visible]);
    function handleAction(action) {
        if (action === 'gallery')
            onGallery();
        else if (action === 'camera')
            onCamera();
        else
            onFile();
    }
    return (<react_native_1.Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <react_native_1.TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}/>
            <react_native_1.Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                <react_native_1.View style={styles.handle}/>
                {OPTIONS.map(function (opt) { return (<react_native_1.TouchableOpacity key={opt.action} style={styles.row} onPress={function () { return handleAction(opt.action); }}>
                        <react_native_1.View style={styles.iconWrap}>
                            <vector_icons_1.Ionicons name={opt.icon} size={24} color={colors.primary}/>
                        </react_native_1.View>
                        <react_native_1.Text style={styles.rowLabel}>{opt.label}</react_native_1.Text>
                    </react_native_1.TouchableOpacity>); })}
                <react_native_1.View style={styles.cancelSpacer}/>
            </react_native_1.Animated.View>
        </react_native_1.Modal>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        backdrop: {
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
        },
        sheet: {
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            backgroundColor: colors.bg,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 12,
            paddingBottom: 32,
        },
        handle: {
            width: 40,
            height: 4,
            backgroundColor: colors.gray300,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 12,
        },
        row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
        iconWrap: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
        },
        rowLabel: { fontSize: 16, color: colors.dark, fontWeight: '500' },
        cancelSpacer: { height: 8 },
    });
}
