import { TouchableOpacity, View, Text, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';
import { formatFileSize } from '../../../shared/utils/media';

interface Props {
    fileName: string;
    fileSize: number;
    fileUrl: string;
    isMe: boolean;
}

export function FileBubble({ fileName, fileSize, fileUrl, isMe }: Props) {
    const colors = useThemeColors();

    async function handlePress() {
        try {
            const supported = await Linking.canOpenURL(fileUrl);
            if (supported) {
                await Linking.openURL(fileUrl);
            } else {
                Alert.alert('Cannot open file', 'No app available to open this file.');
            }
        } catch {
            Alert.alert('Error', 'Could not open the file.');
        }
    }

    return (
        <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
            <Ionicons
                name="document-outline"
                size={28}
                color={isMe ? 'rgba(255,255,255,0.9)' : colors.primary}
            />
            <View style={styles.textContainer}>
                <Text
                    style={[styles.fileName, { color: isMe ? '#FFFFFF' : colors.dark }]}
                    numberOfLines={1}
                >
                    {fileName}
                </Text>
                <Text style={[styles.fileSize, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.gray500 }]}>
                    {formatFileSize(fileSize)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
        minWidth: 180,
        maxWidth: 240,
    },
    textContainer: { flex: 1 },
    fileName: { fontSize: 14, fontWeight: '500' },
    fileSize: { fontSize: 12, marginTop: 2 },
});
