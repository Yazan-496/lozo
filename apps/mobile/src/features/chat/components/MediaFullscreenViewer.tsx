import { useRef, useState } from 'react';
import {
    Modal,
    FlatList,
    Image,
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
    Dimensions,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { MediaItem } from '../../../shared/types';

const { width, height } = Dimensions.get('window');

interface Props {
    items: MediaItem[];
    initialIndex: number;
    visible: boolean;
    onClose: () => void;
}

export function MediaFullscreenViewer({ items, initialIndex, visible, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const listRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <StatusBar hidden />
            <View style={styles.container}>
                <FlatList
                    ref={listRef}
                    data={items}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={initialIndex}
                    getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    renderItem={({ item }) => (
                        <View style={styles.page}>
                            <Image
                                source={{ uri: item.mediaUrl }}
                                style={styles.image}
                                resizeMode="contain"
                            />
                        </View>
                    )}
                />
                <TouchableOpacity
                    style={[styles.closeBtn, { top: insets.top + 12 }]}
                    onPress={onClose}
                    hitSlop={12}
                    activeOpacity={0.7}
                >
                    <View style={styles.closeBg}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>

                <Text style={[styles.counter, { bottom: insets.bottom + 16 }]}>
                    {currentIndex + 1} / {items.length}
                </Text>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    page: {
        width,
        height,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width,
        height,
    },
    closeBtn: {
        position: 'absolute',
        right: 16,
    },
    closeBg: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 6,
    },
    counter: {
        position: 'absolute',
        alignSelf: 'center',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },
});
