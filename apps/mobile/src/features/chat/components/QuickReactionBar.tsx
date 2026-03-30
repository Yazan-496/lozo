import { useEffect, useRef } from 'react';
import {
    Modal,
    TouchableOpacity,
    View,
    Text,
    Animated,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { lightColors as colors } from '../../../shared/utils/theme';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
const { height: screenHeight } = Dimensions.get('window');

interface Props {
    visible: boolean;
    messageId: string;
    messageY: number;
    currentUserEmoji: string | null;
    onReact: (emoji: string) => void;
    onClose: () => void;
}

export function QuickReactionBar({
    visible,
    messageId,
    messageY,
    currentUserEmoji,
    onReact,
    onClose,
}: Props) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const isAbove = messageY > screenHeight / 2;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 150,
                    friction: 8,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 120,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const positionStyle = isAbove
        ? { bottom: screenHeight - messageY + 8 }
        : { top: messageY + 8 };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={onClose}
            />
            <Animated.View
                style={[
                    styles.bar,
                    positionStyle,
                    { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
                ]}
            >
                {QUICK_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                        key={emoji}
                        style={[
                            styles.emojiBtn,
                            currentUserEmoji === emoji && styles.emojiBtnActive,
                        ]}
                        onPress={() => onReact(emoji)}
                    >
                        <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                ))}
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    bar: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        backgroundColor: colors.white,
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
        backgroundColor: colors.primary + '25',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    emojiText: {
        fontSize: 24,
    },
});
