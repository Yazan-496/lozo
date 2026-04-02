import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';
import type { ScheduledMessage } from '../../../shared/types';

interface ScheduledMessageBubbleProps {
    message: ScheduledMessage;
    onPress?: () => void;
}

export function ScheduledMessageBubble({ message, onPress }: ScheduledMessageBubbleProps) {
    const colors = useThemeColors();

    const isLocked = () => {
        const scheduledTime = new Date(message.scheduledAt).getTime();
        const now = Date.now();
        return scheduledTime - now < 30000; // 30 seconds
    };

    const formatScheduledTime = () => {
        const date = new Date(message.scheduledAt);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
    };

    const getStatusColor = () => {
        if (message.status === 'sending') return colors.warning;
        if (isLocked()) return colors.warning;
        return colors.secondaryText;
    };

    const getStatusText = () => {
        if (message.status === 'sending') return 'Queued - will send when online';
        if (isLocked()) return 'Sending soon...';
        return `Scheduled for ${formatScheduledTime()}`;
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            disabled={isLocked() || message.status === 'sending'}
        >
            <View style={[styles.bubble, { backgroundColor: colors.primary }]}>
                <Text style={[styles.content, { color: 'white' }]}>{message.content}</Text>

                <View style={styles.footer}>
                    <View style={styles.statusContainer}>
                        <Text style={[styles.statusText, { color: getStatusColor() }]}>
                            {getStatusText()}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'flex-end',
        marginVertical: 4,
        marginHorizontal: 16,
    },
    bubble: {
        maxWidth: '80%',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    content: {
        fontSize: 16,
        lineHeight: 20,
    },
    footer: {
        marginTop: 4,
        alignItems: 'flex-end',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clockIcon: {
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
});
