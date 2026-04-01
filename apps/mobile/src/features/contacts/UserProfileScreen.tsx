import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Avatar } from '../../shared/components/Avatar';
import { useToast } from '../../shared/components/Toast';
import { contactsApi } from '../../shared/services/api';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../shared/utils/theme';
import type { PendingRequest } from '../../shared/types';

type RequestStatus = 'loading' | 'none' | 'pending_sent' | 'pending_received' | 'blocked';

export function UserProfileScreen({ navigation, route }: any) {
  const { user } = route.params;
  const [status, setStatus] = useState<RequestStatus>('loading');
  const [showLoverModal, setShowLoverModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setStatus('loading');
    try {
      const { data } = await contactsApi.getPending();
      const sent = (data as PendingRequest[]).find((r: any) => r.to?.id === user.id || r.addresseeId === user.id);
      const received = (data as PendingRequest[]).find((r: PendingRequest) => r.from.id === user.id);
      if (received) { setStatus('pending_received'); return; }
      if (sent) { setStatus('pending_sent'); return; }
      setStatus('none');
    } catch {
      setStatus('none');
    }
  }

  async function sendRequest(asLover = false) {
    setSaving(true);
    try {
      await contactsApi.sendRequest(user.id);
      showToast('success', `Request sent! You can set the relationship type after they accept.`);
      setStatus('pending_sent');
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to send request');
    } finally {
      setSaving(false);
    }
  }

  function handleBlock() {
    Alert.alert(
      `Block ${user.displayName}?`,
      'They will not be able to message you or send you requests.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await contactsApi.blockContact(user.id);
              showToast('success', 'User blocked');
              navigation.goBack();
            } catch {
              showToast('error', 'Failed to block');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }

  async function handleUnblock() {
    Alert.alert(
      `Unblock ${user.displayName}?`,
      'Unblocking will not restore the contact relationship.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            setSaving(true);
            try {
              await contactsApi.unblockUser(user.id);
              showToast('success', 'User unblocked');
              setStatus('none');
            } catch {
              showToast('error', 'Failed to unblock');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + name */}
      <View style={styles.header}>
        <Avatar uri={user.avatarUrl} name={user.displayName} color={user.avatarColor} size={80} />
        <Text style={[styles.displayName, { color: colors.dark }]}>{user.displayName}</Text>
        <Text style={[styles.username, { color: colors.gray400 }]}>@{user.username}</Text>
        {!!user.bio && (
          <Text style={[styles.bio, { color: colors.gray500 }]}>{user.bio}</Text>
        )}
      </View>

      {saving && <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />}

      {/* Action buttons based on status */}
      {status === 'loading' && <ActivityIndicator color={colors.primary} />}

      {status === 'none' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => sendRequest(false)}
            disabled={saving}
          >
            <Text style={styles.btnText}>Add as Friend 💙</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#E91E63' }]}
            onPress={() => setShowLoverModal(true)}
            disabled={saving}
          >
            <Text style={styles.btnText}>Add as Lover ❤️</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'pending_sent' && (
        <View style={styles.actions}>
          <View style={[styles.btn, { backgroundColor: colors.gray100 }]}>
            <Text style={[styles.btnText, { color: colors.gray500 }]}>Request Pending…</Text>
          </View>
        </View>
      )}

      {status === 'pending_received' && (
        <View style={styles.actions}>
          <Text style={[styles.note, { color: colors.gray500 }]}>
            This user already sent you a request. Go to Notifications to accept.
          </Text>
        </View>
      )}

      {status === 'blocked' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.gray100 }]}
            onPress={handleUnblock}
            disabled={saving}
          >
            <Text style={[styles.btnText, { color: colors.dark }]}>Unblock</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Block button — always visible unless already blocked */}
      {status !== 'blocked' && status !== 'loading' && (
        <TouchableOpacity
          style={[styles.btn, styles.blockBtn]}
          onPress={handleBlock}
          disabled={saving}
        >
          <Text style={[styles.btnText, { color: '#F44336' }]}>Block</Text>
        </TouchableOpacity>
      )}

      {/* Lover confirmation modal */}
      <Modal
        visible={showLoverModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoverModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.bg }]}>
            <Text style={[styles.modalTitle, { color: colors.dark }]}>Add as Lover ❤️</Text>
            <Text style={[styles.modalBody, { color: colors.gray500 }]}>
              This sends a friend request to {user.displayName}.{'\n\n'}
              You can set the relationship type to "Lover" after they accept your request.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowLoverModal(false)} style={styles.modalCancel}>
                <Text style={[styles.modalCancelText, { color: colors.gray500 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, { backgroundColor: '#E91E63' }]}
                onPress={() => { setShowLoverModal(false); sendRequest(true); }}
              >
                <Text style={styles.modalConfirmText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    header: {
      alignItems: 'center',
      paddingTop: 32,
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    displayName: {
      fontSize: 22,
      fontWeight: '700',
      marginTop: 14,
    },
    username: {
      fontSize: 15,
      marginTop: 4,
    },
    bio: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 20,
    },
    actions: {
      paddingHorizontal: 24,
      gap: 12,
    },
    btn: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    btnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    blockBtn: {
      marginHorizontal: 24,
      marginTop: 12,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#F44336',
    },
    note: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    modalBox: {
      borderRadius: 16,
      padding: 24,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
    },
    modalBody: {
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 20,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    modalCancel: { paddingVertical: 8, paddingHorizontal: 16 },
    modalCancelText: { fontSize: 15, fontWeight: '500' },
    modalConfirm: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
    modalConfirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  });
}
