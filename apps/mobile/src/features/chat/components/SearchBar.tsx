import { useRef, useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';

interface Props {
    onSearch: (query: string) => void;
    onClose: () => void;
}

export function SearchBar({ onSearch, onClose }: Props) {
    const colors = useThemeColors();
    const [query, setQuery] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<TextInput>(null);

    function handleChange(text: string) {
        setQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onSearch(text);
        }, 300);
    }

    function handleClose() {
        setQuery('');
        onSearch('');
        onClose();
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.gray400} style={styles.icon} />
            <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.dark }]}
                placeholder="Search messages..."
                placeholderTextColor={colors.gray400}
                value={query}
                onChangeText={handleChange}
                autoFocus
                returnKeyType="search"
                clearButtonMode="never"
            />
            {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); onSearch(''); }} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.gray400} />
                </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleClose} hitSlop={8} style={styles.cancelBtn}>
                <Ionicons name="close" size={22} color={colors.primary} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    },
    cancelBtn: {
        marginLeft: 10,
    },
});
