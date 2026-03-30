import { useEffect, useRef } from 'react';
import { Modal, View, TouchableOpacity, Text, FlatList, StyleSheet, Dimensions, Animated } from 'react-native';
import { lightColors as colors } from '../../../shared/utils/theme';

// ~48 emojis across 4 categories
const EMOJI_DATA = [
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

const NUM_COLS = 6;
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface Props {
    visible: boolean;
    currentUserEmoji: string | null;
    onReact: (emoji: string) => void;
    onClose: () => void;
}

export function EmojiPickerModal({ visible, currentUserEmoji, onReact, onClose }: Props) {
    const slideAnim = useRef(new Animated.Value(screenHeight * 0.6)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 12,
            }).start();
        } else {
            slideAnim.setValue(screenHeight * 0.6);
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            {/* Static backdrop covering top 40% — tapping closes the picker */}
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            />
            {/* Sheet slides up independently */}
            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                {/* Drag handle */}
                <View style={styles.handle} />
                <FlatList
                    data={EMOJI_DATA}
                    keyExtractor={(item) => item}
                    numColumns={NUM_COLS}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.emojiCell,
                                currentUserEmoji === item && styles.emojiCellActive,
                            ]}
                            onPress={() => onReact(item)}
                        >
                            <Text style={styles.emojiText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                />
            </Animated.View>
        </Modal>
    );
}

const cellSize = screenWidth / NUM_COLS;

const styles = StyleSheet.create({
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
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.gray300,
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
        backgroundColor: colors.primary + '25',
    },
    emojiText: {
        fontSize: 32,
    },
});
