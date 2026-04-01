import { useEffect, useMemo, useRef } from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../../shared/utils/theme';

interface Props {
    visible: boolean;
    onClose: () => void;
    onGallery: () => void;
    onCamera: () => void;
    onFile: () => void;
}

const OPTIONS = [
    { label: 'Gallery', icon: 'images-outline' as const, action: 'gallery' },
    { label: 'Camera', icon: 'camera-outline' as const, action: 'camera' },
    { label: 'File', icon: 'document-outline' as const, action: 'file' },
];

export function AttachmentSheet({ visible, onClose, onGallery, onCamera, onFile }: Props) {
    const colors = useThemeColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
        } else {
            slideAnim.setValue(300);
        }
    }, [visible]);

    function handleAction(action: string) {
        if (action === 'gallery') onGallery();
        else if (action === 'camera') onCamera();
        else onFile();
    }

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.handle} />
                {OPTIONS.map((opt) => (
                    <TouchableOpacity key={opt.action} style={styles.row} onPress={() => handleAction(opt.action)}>
                        <View style={styles.iconWrap}>
                            <Ionicons name={opt.icon} size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.rowLabel}>{opt.label}</Text>
                    </TouchableOpacity>
                ))}
                <View style={styles.cancelSpacer} />
            </Animated.View>
        </Modal>
    );
}

function makeStyles(colors: ThemeColors) {
    return StyleSheet.create({
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
