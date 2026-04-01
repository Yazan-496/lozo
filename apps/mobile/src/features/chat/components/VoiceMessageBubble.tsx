import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';
import { formatDuration } from '../../../shared/utils/media';

const BAR_HEIGHTS = [16, 24, 20, 28];

interface Props {
    messageId: string;
    audioUrl: string;
    duration: number;
    isPlaying: boolean;
    isMe: boolean;
    onPlay: () => void;
    onPause: () => void;
}

export function VoiceMessageBubble({ duration, isPlaying, isMe, onPlay, onPause }: Props) {
    const colors = useThemeColors();
    const barColor = isMe ? 'rgba(255,255,255,0.7)' : colors.primary;
    const durationColor = isMe ? 'rgba(255,255,255,0.7)' : colors.gray500;

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.playBtn} onPress={isPlaying ? onPause : onPlay}>
                <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={20}
                    color={isMe ? '#FFFFFF' : colors.primary}
                />
            </TouchableOpacity>
            <View style={styles.barsContainer}>
                {BAR_HEIGHTS.map((h, i) => (
                    <View key={i} style={[styles.bar, { height: h, backgroundColor: barColor }]} />
                ))}
            </View>
            <Text style={[styles.duration, { color: durationColor }]}>
                {formatDuration(duration)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
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
