"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageViewerModal = ImageViewerModal;
var react_1 = require("react");
var react_native_1 = require("react-native");
var _a = react_native_1.Dimensions.get('window'), screenWidth = _a.width, screenHeight = _a.height;
function getDistance(touches) {
    var dx = touches[0].pageX - touches[1].pageX;
    var dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
}
function formatSentAt(iso) {
    var d = new Date(iso);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function ImageViewerModal(_a) {
    var _b;
    var visible = _a.visible, imageUrl = _a.imageUrl, onClose = _a.onClose, senderName = _a.senderName, senderAvatarUrl = _a.senderAvatarUrl, senderColor = _a.senderColor, sentAt = _a.sentAt;
    var scale = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    var translateY = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    var lastScale = (0, react_1.useRef)(1);
    var lastDistance = (0, react_1.useRef)(null);
    var panResponder = (0, react_1.useRef)(react_native_1.PanResponder.create({
        onStartShouldSetPanResponder: function () { return true; },
        onMoveShouldSetPanResponder: function () { return true; },
        onPanResponderGrant: function () {
            lastDistance.current = null;
        },
        onPanResponderMove: function (evt, gestureState) {
            var touches = evt.nativeEvent.touches;
            if (touches.length === 2) {
                var dist = getDistance(touches);
                if (lastDistance.current !== null) {
                    var delta = dist - lastDistance.current;
                    var newScale = Math.min(4, Math.max(1, lastScale.current + delta * 0.01));
                    lastScale.current = newScale;
                    scale.setValue(newScale);
                }
                lastDistance.current = dist;
            }
            else if (touches.length === 1 && lastScale.current <= 1.05) {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            }
        },
        onPanResponderRelease: function (_, gestureState) {
            lastDistance.current = null;
            if (lastScale.current <= 1.05 && gestureState.dy > 80) {
                react_native_1.Animated.timing(translateY, {
                    toValue: screenHeight,
                    duration: 200,
                    useNativeDriver: true,
                }).start(function () {
                    translateY.setValue(0);
                    scale.setValue(1);
                    lastScale.current = 1;
                    onClose();
                });
            }
            else {
                react_native_1.Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
            }
        },
    })).current;
    function handleClose() {
        scale.setValue(1);
        lastScale.current = 1;
        translateY.setValue(0);
        onClose();
    }
    var initials = (_b = senderName === null || senderName === void 0 ? void 0 : senderName.charAt(0).toUpperCase()) !== null && _b !== void 0 ? _b : '?';
    return (<react_native_1.Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
            <react_native_1.View style={styles.container}>
                {/* Top bar with sender info */}
                <react_native_1.View style={styles.topBar}>
                    <react_native_1.TouchableOpacity style={styles.backBtn} onPress={handleClose}>
                        <react_native_1.Text style={styles.backText}>‹</react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                    <react_native_1.View style={styles.senderRow}>
                        {senderAvatarUrl ? (<react_native_1.Image source={{ uri: senderAvatarUrl }} style={styles.senderAvatar}/>) : (<react_native_1.View style={[styles.senderAvatar, { backgroundColor: senderColor !== null && senderColor !== void 0 ? senderColor : '#0084FF' }]}>
                                <react_native_1.Text style={styles.senderInitial}>{initials}</react_native_1.Text>
                            </react_native_1.View>)}
                        <react_native_1.View style={styles.senderInfo}>
                            <react_native_1.Text style={styles.senderName} numberOfLines={1}>{senderName !== null && senderName !== void 0 ? senderName : ''}</react_native_1.Text>
                            {sentAt && <react_native_1.Text style={styles.sentAt}>{formatSentAt(sentAt)}</react_native_1.Text>}
                        </react_native_1.View>
                    </react_native_1.View>
                </react_native_1.View>

                {/* Image */}
                <react_native_1.Animated.Image source={{ uri: imageUrl !== null && imageUrl !== void 0 ? imageUrl : undefined }} style={[styles.image, { transform: [{ scale: scale }, { translateY: translateY }] }]} resizeMode="contain" {...panResponder.panHandlers}/>
            </react_native_1.View>
        </react_native_1.Modal>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 48,
        paddingBottom: 12,
        paddingHorizontal: 8,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    backText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '300',
        lineHeight: 36,
        marginTop: -4,
    },
    senderRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    senderAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    senderInitial: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    senderInfo: {
        flex: 1,
    },
    senderName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    sentAt: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 12,
        marginTop: 1,
    },
    image: {
        width: screenWidth,
        height: screenHeight,
    },
});
