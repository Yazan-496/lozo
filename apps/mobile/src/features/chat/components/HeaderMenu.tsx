import { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';

interface MenuItem {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

interface Props {
    items: MenuItem[];
}

export function HeaderMenu({ items }: Props) {
    const colors = useThemeColors();
    const [visible, setVisible] = useState(false);
    const btnRef = useRef<View>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

    function openMenu() {
        btnRef.current?.measureInWindow((x, y, width, height) => {
            setMenuPos({ top: y + height + 4, right: 8 });
            setVisible(true);
        });
    }

    return (
        <>
            <View ref={btnRef} collapsable={false}>
                <TouchableOpacity onPress={openMenu} hitSlop={8} style={styles.trigger}>
                    <Ionicons name="ellipsis-vertical" size={22} color={colors.gray500} />
                </TouchableOpacity>
            </View>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
                    <View
                        style={[
                            styles.menu,
                            {
                                backgroundColor: colors.bg,
                                borderColor: colors.border,
                                top: menuPos.top,
                                right: menuPos.right,
                            },
                        ]}
                    >
                        {items.map((item, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.item,
                                    idx < items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                                ]}
                                onPress={() => {
                                    setVisible(false);
                                    item.onPress();
                                }}
                                activeOpacity={0.7}
                            >
                                {item.icon && (
                                    <Ionicons name={item.icon} size={18} color={colors.dark} style={styles.itemIcon} />
                                )}
                                <Text style={[styles.itemLabel, { color: colors.dark }]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    trigger: {
        padding: 4,
        marginRight: 4,
    },
    overlay: {
        flex: 1,
    },
    menu: {
        position: 'absolute',
        minWidth: 160,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        overflow: 'hidden',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
    },
    itemIcon: {
        marginRight: 10,
    },
    itemLabel: {
        fontSize: 15,
    },
});
