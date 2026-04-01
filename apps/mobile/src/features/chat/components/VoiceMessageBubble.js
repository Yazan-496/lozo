"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceMessageBubble = VoiceMessageBubble;
var react_native_1 = require("react-native");
var vector_icons_1 = require("@expo/vector-icons");
var useThemeColors_1 = require("../../../shared/hooks/useThemeColors");
var media_1 = require("../../../shared/utils/media");
var BAR_HEIGHTS = [16, 24, 20, 28];
function VoiceMessageBubble(_a) {
    var duration = _a.duration, isPlaying = _a.isPlaying, isMe = _a.isMe, onPlay = _a.onPlay, onPause = _a.onPause;
    var colors = (0, useThemeColors_1.useThemeColors)();
    var barColor = isMe ? 'rgba(255,255,255,0.7)' : colors.primary;
    var durationColor = isMe ? 'rgba(255,255,255,0.7)' : colors.gray500;
    return (<react_native_1.View style={styles.container}>
            <react_native_1.TouchableOpacity style={styles.playBtn} onPress={isPlaying ? onPause : onPlay}>
                <vector_icons_1.Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={isMe ? '#FFFFFF' : colors.primary}/>
            </react_native_1.TouchableOpacity>
            <react_native_1.View style={styles.barsContainer}>
                {BAR_HEIGHTS.map(function (h, i) { return (<react_native_1.View key={i} style={[styles.bar, { height: h, backgroundColor: barColor }]}/>); })}
            </react_native_1.View>
            <react_native_1.Text style={[styles.duration, { color: durationColor }]}>
                {(0, media_1.formatDuration)(duration)}
            </react_native_1.Text>
        </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, minWidth: 160 },
    playBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    barsContainer: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
    bar: { width: 3, borderRadius: 2, flex: 1 },
    duration: { fontSize: 12, fontWeight: '500', minWidth: 32 },
});
