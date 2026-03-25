import { View, Text, Image } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name: string;
  color: string;
  size?: number;
  isOnline?: boolean;
}

export function Avatar({ uri, name, color, size = 48, isOnline }: AvatarProps) {
  const fontSize = size * 0.4;
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
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
          <Text style={{ color: '#fff', fontSize, fontWeight: '600' }}>
            {initial}
          </Text>
        </View>
      )}
      {isOnline !== undefined && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: size * 0.14,
            backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E',
            borderWidth: 2,
            borderColor: '#fff',
          }}
        />
      )}
    </View>
  );
}
