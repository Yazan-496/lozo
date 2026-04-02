import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useToast } from '../../../shared/components/Toast';
import {
    scheduleMessage,
    getScheduledMessages,
    getScheduledMessageCount,
    updateScheduledMessage,
    cancelScheduledMessage,
} from '../../../shared/db/scheduled.db.ts';
import type { ScheduledMessage } from '../../../shared/types';

interface UseScheduledMessagesOptions {
    conversationId: string;
}

export function useScheduledMessages({ conversationId }: UseScheduledMessagesOptions) {
    const { showToast } = useToast();
    const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
    const [loading, setLoading] = useState(true);

    // Load scheduled messages for conversation
    const loadScheduledMessages = useCallback(async () => {
        try {
            const messages = await getScheduledMessages(conversationId);
            setScheduledMessages(messages);
        } catch (error) {
            console.error('Error loading scheduled messages:', error);
            showToast('error', 'Failed to load scheduled messages');
        } finally {
            setLoading(false);
        }
    }, [conversationId, showToast]);

    // Initial load
    useEffect(() => {
        loadScheduledMessages();
    }, [loadScheduledMessages]);

    // Schedule a new message
    const scheduleNewMessage = useCallback(
        async (content: string, scheduledAt: Date): Promise<boolean> => {
            try {
                // Validate content
                if (!content.trim()) {
                    Alert.alert('Error', 'Message cannot be empty.');
                    return false;
                }

                // Check maximum scheduled messages per conversation
                const count = await getScheduledMessageCount(conversationId);
                if (count >= 100) {
                    Alert.alert(
                        'Limit Reached',
                        'You can only have up to 100 scheduled messages per conversation.',
                    );
                    return false;
                }

                // Validate scheduled time
                const now = new Date();
                const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

                if (scheduledAt <= now) {
                    Alert.alert('Invalid Time', 'Please select a future date and time.');
                    return false;
                }

                if (scheduledAt > maxDate) {
                    Alert.alert(
                        'Invalid Time',
                        'Messages can only be scheduled up to 30 days in advance.',
                    );
                    return false;
                }

                // Schedule the message
                await scheduleMessage(conversationId, content.trim(), scheduledAt.toISOString());

                // Refresh the list
                await loadScheduledMessages();

                showToast('success', 'Message scheduled successfully');
                return true;
            } catch (error) {
                console.error('Error scheduling message:', error);
                showToast('error', 'Failed to schedule message');
                return false;
            }
        },
        [conversationId, loadScheduledMessages, showToast],
    );

    // Update scheduled message content
    const updateContent = useCallback(
        async (id: string, newContent: string): Promise<boolean> => {
            try {
                if (!newContent.trim()) {
                    Alert.alert('Error', 'Message cannot be empty.');
                    return false;
                }

                await updateScheduledMessage(id, { content: newContent.trim() });
                await loadScheduledMessages();

                showToast('success', 'Message updated');
                return true;
            } catch (error) {
                console.error('Error updating scheduled message:', error);
                showToast('error', 'Failed to update message');
                return false;
            }
        },
        [loadScheduledMessages, showToast],
    );

    // Reschedule a message
    const reschedule = useCallback(
        async (id: string, newScheduledAt: Date): Promise<boolean> => {
            try {
                // Validate scheduled time
                const now = new Date();
                const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                if (newScheduledAt <= now) {
                    Alert.alert('Invalid Time', 'Please select a future date and time.');
                    return false;
                }

                if (newScheduledAt > maxDate) {
                    Alert.alert(
                        'Invalid Time',
                        'Messages can only be scheduled up to 30 days in advance.',
                    );
                    return false;
                }

                await updateScheduledMessage(id, { scheduledAt: newScheduledAt.toISOString() });
                await loadScheduledMessages();

                showToast('success', 'Message rescheduled');
                return true;
            } catch (error) {
                console.error('Error rescheduling message:', error);
                showToast('error', 'Failed to reschedule message');
                return false;
            }
        },
        [loadScheduledMessages, showToast],
    );

    // Cancel a scheduled message
    const cancelScheduled = useCallback(
        async (id: string): Promise<boolean> => {
            try {
                await cancelScheduledMessage(id);
                await loadScheduledMessages();

                showToast('success', 'Message canceled');
                return true;
            } catch (error) {
                console.error('Error canceling scheduled message:', error);
                showToast('error', 'Failed to cancel message');
                return false;
            }
        },
        [loadScheduledMessages, showToast],
    );

    // Check if a message is locked for editing (< 30 seconds to send)
    const isLocked = useCallback((scheduledAt: string): boolean => {
        const scheduledTime = new Date(scheduledAt).getTime();
        const now = Date.now();
        return scheduledTime - now < 30000; // 30 seconds
    }, []);

    // Refresh scheduled messages (for manual refresh)
    const refreshScheduledMessages = useCallback(() => {
        return loadScheduledMessages();
    }, [loadScheduledMessages]);

    return {
        scheduledMessages,
        loading,
        scheduleNewMessage,
        updateContent,
        reschedule,
        cancelScheduled,
        isLocked,
        refreshScheduledMessages,
    };
}
