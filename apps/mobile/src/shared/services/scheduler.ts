import { AppState } from 'react-native';
import { getDueMessages, markAsSending, deleteScheduledMessage } from '../db/scheduled.db.ts';
import { insertMessage } from '../db/messages.db.ts';
import { enqueueOutbox } from '../db/outbox.db.ts';
import { useAuthStore } from '../stores/auth';

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: any = null;

// Start the scheduler - begins 30-second interval timer
export function startScheduler(): void {
    if (schedulerInterval) {
        console.log('[Scheduler] Already running');
        return;
    }

    console.log('[Scheduler] Starting scheduler service');

    // Start interval timer (30 seconds)
    schedulerInterval = setInterval(() => {
        checkDueMessages();
    }, 30000); // 30 seconds

    // Check for missed messages on startup
    checkDueMessages();

    // Listen for app state changes
    appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
            console.log('[Scheduler] App became active, checking due messages');
            checkDueMessages();
        }
    });
}

// Stop the scheduler
export function stopScheduler(): void {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log('[Scheduler] Scheduler stopped');
    }

    if (appStateSubscription) {
        appStateSubscription?.remove();
        appStateSubscription = null;
    }
}

// Check and process due messages
export async function checkDueMessages(): Promise<void> {
    try {
        const dueMessages = await getDueMessages();

        if (dueMessages.length === 0) {
            return;
        }

        console.log(`[Scheduler] Processing ${dueMessages.length} due messages`);

        // Process each due message
        for (const scheduled of dueMessages) {
            await processDueMessage(scheduled);
        }
    } catch (error) {
        console.error('[Scheduler] Error checking due messages:', error);
    }
}

// Process a single due message
async function processDueMessage(scheduled: any): Promise<void> {
    try {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
            console.error('[Scheduler] No current user, cannot process scheduled message');
            return;
        }

        // Mark as sending to prevent duplicate processing
        await markAsSending(scheduled.id);

        // Generate local message ID
        const localId = Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);

        // Create message in messages table
        await insertMessage({
            local_id: localId,
            server_id: null,
            conversation_id: scheduled.conversationId,
            sender_id: currentUser.id,
            type: 'text',
            content: scheduled.content,
            media_url: null,
            media_name: null,
            media_size: null,
            media_duration: null,
            reply_to_id: null,
            is_forwarded: 0,
            forwarded_from_id: null,
            edited_at: null,
            deleted_for_everyone: 0,
            sync_status: 'pending',
            created_at: new Date().toISOString(),
            server_created_at: null,
        });

        // Add to outbox for network sync
        const payload = {
            conversationId: scheduled.conversationId,
            content: scheduled.content,
            type: 'text',
            localId: localId,
        };

        await enqueueOutbox(localId, scheduled.conversationId, payload);

        // Delete from scheduled messages (successful processing)
        await deleteScheduledMessage(scheduled.id);

        console.log(`[Scheduler] Processed scheduled message: ${scheduled.id}`);
    } catch (error) {
        console.error(`[Scheduler] Error processing scheduled message ${scheduled.id}:`, error);
        // Message remains in 'sending' status for retry later
    }
}
