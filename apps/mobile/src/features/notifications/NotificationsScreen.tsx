import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar } from '../../shared/components/Avatar';
import { useToast } from '../../shared/components/Toast';
import { api } from '../../shared/services/api';
import { useNotificationsStore } from '../../shared/stores/notifications';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../shared/utils/theme';
import type { PendingRequest } from '../../shared/types';

export function NotificationsScreen() {
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const setPendingCount = useNotificationsStore((s) => s.setPendingRequestsCount);
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { showToast } = useToast();

  async function load() {
    try {
      const { data } = await api.get<PendingRequest[]>('/contacts/pending');
      setPending(data);
      setPendingCount(data.length);
    } catch {}
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleAccept(contactId: string) {
    try {
      await api.post(`/contacts/accept/${contactId}`);
      load();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed');
    }
  }

  async function handleReject(contactId: string) {
    try {
      await api.post(`/contacts/reject/${contactId}`);
      load();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed');
    }
  }

  return (
    <FlatList
      style={styles.container}
      data={pending}
      keyExtractor={(item) => item.contactId}
      contentContainerStyle={pending.length === 0 ? styles.emptyContainer : undefined}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Avatar
            uri={item.from.avatarUrl}
            name={item.from.displayName}
            color={item.from.avatarColor}
            size={50}
          />
          <View style={styles.info}>
            <Text style={styles.name}>{item.from.displayName}</Text>
            <Text style={styles.handle}>@{item.from.username} sent you a friend request</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleAccept(item.contactId)}
            >
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => handleReject(item.contactId)}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySubtitle}>Friend requests will appear here</Text>
        </View>
      }
    />
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    info: {
      flex: 1,
      marginLeft: 12,
    },
    name: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.dark,
    },
    handle: {
      fontSize: 13,
      color: colors.gray400,
      marginTop: 2,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    acceptBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
    },
    acceptText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },
    declineBtn: {
      backgroundColor: colors.gray100,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
    },
    declineText: {
      color: colors.gray500,
      fontSize: 13,
    },
    empty: {
      alignItems: 'center',
      paddingTop: 40,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.dark,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.gray400,
      marginTop: 4,
    },
  });
}
