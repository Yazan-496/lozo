import { View, Text, Image } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

interface AvatarProps {
    uri?: string | null;
    name: string;
    color: string;
    size?: number;
    isOnline?: boolean;
}

export function Avatar({ uri, name, color, size = 48, isOnline }: AvatarProps) {
    const colors = useThemeColors();
    const fontSize = size * 0.4;
    const initial = name.charAt(0).toUpperCase();
    const dotSize = size * 0.34;

    return (
        <View style={{ width: size, height: size, overflow: 'visible' }}>
            {uri ? (
                <Image
                    source={{ uri }}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                />
            ) : (
                <View
                    style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: color,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{ color: '#fff', fontSize, fontWeight: '700' }}>{initial}</Text>
                </View>
            )}
            {isOnline !== undefined && (
                <View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                        backgroundColor: isOnline ? colors.green : colors.gray300,
                        borderWidth: 4,
                        borderColor: colors.bg,
                    }}
                />
            )}
        </View>
    );
}
