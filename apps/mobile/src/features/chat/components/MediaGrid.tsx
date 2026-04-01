import { View, Image, TouchableOpacity, FlatList, Text, StyleSheet, Dimensions } from 'react-native';
import type { MediaItem } from '../../../shared/types';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';

const COLUMN_COUNT = 3;
const GAP = 2;
const ITEM_SIZE = (Dimensions.get('window').width - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

interface Props {
    items: MediaItem[];
    onPress: (item: MediaItem, index: number) => void;
    onEndReached: () => void;
    emptyText?: string;
}

export function MediaGrid({ items, onPress, onEndReached, emptyText = 'No media shared yet' }: Props) {
    const colors = useThemeColors();

    if (items.length === 0) {
        return (
            <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.gray400 }]}>{emptyText}</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            numColumns={COLUMN_COUNT}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            columnWrapperStyle={styles.row}
            renderItem={({ item, index }) => (
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onPress(item, index)}
                    style={styles.cell}
                >
                    <Image
                        source={{ uri: item.mediaUrl }}
                        style={styles.thumb}
                        resizeMode="cover"
                    />
                </TouchableOpacity>
            )}
        />
    );
}

const styles = StyleSheet.create({
    row: {
        gap: GAP,
        marginBottom: GAP,
    },
    cell: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        backgroundColor: '#1a1a1a',
    },
    thumb: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 15,
    },
});
