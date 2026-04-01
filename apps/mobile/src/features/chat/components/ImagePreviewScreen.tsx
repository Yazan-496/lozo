import { Modal, View, Image, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { lightColors as colors } from '../../../shared/utils/theme';

interface Props {
    visible: boolean;
    uri: string | null;
    onSend: () => void;
    onCancel: () => void;
    isSending: boolean;
}

export function ImagePreviewScreen({ visible, uri, onSend, onCancel, isSending }: Props) {
    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                {uri && (
                    <Image
                        source={{ uri }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                )}
                <View style={styles.bottomBar}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isSending}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
                        onPress={onSend}
                        disabled={isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator color={colors.white} size="small" />
                        ) : (
                            <Text style={styles.sendText}>Send</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
        color: colors.white,
        fontSize: 16,
        fontWeight: '500',
    },
    sendBtn: {
        backgroundColor: colors.primary,
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
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
