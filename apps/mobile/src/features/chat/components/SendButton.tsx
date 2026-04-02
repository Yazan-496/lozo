import { TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';

interface SendButtonProps {
    canSend: boolean;
    onPress: () => void;
    onLongPress: () => void;
    onVoicePress: () => void;
    disabled?: boolean;
}

export function SendButton({ canSend, onPress, onLongPress, onVoicePress, disabled = false }: SendButtonProps) {
    const colors = useThemeColors();

    const handleLongPress = () => {
        if (disabled || !canSend) return;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Send Now', 'Schedule'],
                    cancelButtonIndex: 0,
                    title: 'Send Options',
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        onPress();
                    } else if (buttonIndex === 2) {
                        onLongPress();
                    }
                },
            );
        } else {
            // Android - use Alert
            Alert.alert(
                'Send Options',
                'Choose how to send this message',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Send Now', onPress },
                    { text: 'Schedule', onPress: onLongPress },
                ],
                { cancelable: true },
            );
        }
    };

    if (canSend) {
        return (
            <TouchableOpacity
                style={[styles.button, styles.sendActive, { backgroundColor: colors.primary }]}
                onPress={onPress}
                onLongPress={handleLongPress}
                delayLongPress={500}
                disabled={disabled}
            >
                <Ionicons name="arrow-up" size={20} color="white" />
            </TouchableOpacity>
        );
    } else {
        return (
            <TouchableOpacity
                style={[styles.button, styles.sendInactive, { backgroundColor: colors.gray300 }]}
                onPress={onVoicePress}
                disabled={disabled}
            >
                <Ionicons name="mic-outline" size={20} color={colors.gray400} />
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    button: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendActive: {
        // Active send button styles
    },
    sendInactive: {
        // Inactive send button styles
    },
});
