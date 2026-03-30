import { useRef } from 'react';
import {
    Modal,
    View,
    TouchableOpacity,
    Text,
    Image,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Props {
    visible: boolean;
    imageUrl: string | null;
    onClose: () => void;
    senderName?: string;
    senderAvatarUrl?: string | null;
    senderColor?: string;
    sentAt?: string;
}

function getDistance(touches: any[]) {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
}

function formatSentAt(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ImageViewerModal({ visible, imageUrl, onClose, senderName, senderAvatarUrl, senderColor, sentAt }: Props) {
    const scale = useRef(new Animated.Value(1)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const lastScale = useRef(1);
    const lastDistance = useRef<number | null>(null);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                lastDistance.current = null;
            },

            onPanResponderMove: (evt, gestureState) => {
                const touches = evt.nativeEvent.touches;

                if (touches.length === 2) {
                    const dist = getDistance(touches as any);
                    if (lastDistance.current !== null) {
                        const delta = dist - lastDistance.current;
                        const newScale = Math.min(4, Math.max(1, lastScale.current + delta * 0.01));
                        lastScale.current = newScale;
                        scale.setValue(newScale);
                    }
                    lastDistance.current = dist;
                } else if (touches.length === 1 && lastScale.current <= 1.05) {
                    if (gestureState.dy > 0) {
                        translateY.setValue(gestureState.dy);
                    }
                }
            },

            onPanResponderRelease: (_, gestureState) => {
                lastDistance.current = null;

                if (lastScale.current <= 1.05 && gestureState.dy > 80) {
                    Animated.timing(translateY, {
                        toValue: screenHeight,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        translateY.setValue(0);
                        scale.setValue(1);
                        lastScale.current = 1;
                        onClose();
                    });
                } else {
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
                }
            },
        }),
    ).current;

    function handleClose() {
        scale.setValue(1);
        lastScale.current = 1;
        translateY.setValue(0);
        onClose();
    }

    const initials = senderName?.charAt(0).toUpperCase() ?? '?';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View style={styles.container}>
                {/* Top bar with sender info */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
                        <Text style={styles.backText}>‹</Text>
                    </TouchableOpacity>
                    <View style={styles.senderRow}>
                        {senderAvatarUrl ? (
                            <Image source={{ uri: senderAvatarUrl }} style={styles.senderAvatar} />
                        ) : (
                            <View style={[styles.senderAvatar, { backgroundColor: senderColor ?? '#0084FF' }]}>
                                <Text style={styles.senderInitial}>{initials}</Text>
                            </View>
                        )}
                        <View style={styles.senderInfo}>
                            <Text style={styles.senderName} numberOfLines={1}>{senderName ?? ''}</Text>
                            {sentAt && <Text style={styles.sentAt}>{formatSentAt(sentAt)}</Text>}
                        </View>
                    </View>
                </View>

                {/* Image */}
                <Animated.Image
                    source={{ uri: imageUrl ?? undefined }}
                    style={[styles.image, { transform: [{ scale }, { translateY }] }]}
                    resizeMode="contain"
                    {...panResponder.panHandlers}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
