import { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar } from '../../shared/components/Avatar';
import { ContactSkeleton } from '../../shared/components/ContactSkeleton';
import { useToast } from '../../shared/components/Toast';
import { api, contactsApi } from '../../shared/services/api';
import { usePresenceStore } from '../../shared/stores/presence';
import { useNotificationsStore } from '../../shared/stores/notifications';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../shared/utils/theme';
import { getPresenceString } from '../../shared/utils/presence';
import type { Contact, PendingRequest, User, RootStackParamList } from '../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export function ContactsScreen({ navigation }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const { showToast } = useToast();
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const setPendingCount = useNotificationsStore((s) => s.setPendingRequestsCount);
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  async function loadData() {
    try {
      const [contactsRes, pendingRes, blockedRes] = await Promise.all([
        api.get<Contact[]>('/contacts'),
        api.get<PendingRequest[]>('/contacts/pending'),
        contactsApi.getBlockedUsers().catch(() => ({ data: [] })),
      ]);
      setContacts(contactsRes.data);
      setPending(pendingRes.data);
      setBlockedUsers((blockedRes as any).data ?? []);
      setPendingCount(pendingRes.data.length);
      if (isFirstLoad) setIsFirstLoad(false);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      if (isFirstLoad) setIsFirstLoad(false);
    }
  }

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get<User[]>(`/contacts/search?q=${query}`);
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    }
  }

  async function handleSendRequest(userId: string) {
    try {
      await api.post(`/contacts/request/${userId}`);
      showToast('success', 'Friend request sent!');
      setSearchQuery('');
      setSearchResults([]);
      setSearching(false);
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed to send request');
    }
  }

  async function handleAccept(contactId: string) {
    try {
      await api.post(`/contacts/accept/${contactId}`);
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed');
    }
  }

  async function handleReject(contactId: string) {
    try {
      await api.post(`/contacts/reject/${contactId}`);
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed');
    }
  }

  function handleUnblock(user: User) {
    Alert.alert(
      `Unblock ${user.displayName}?`,
      'Unblocking will not restore the contact relationship.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await contactsApi.unblockUser(user.id);
              showToast('success', 'User unblocked');
              loadData();
            } catch {
              showToast('error', 'Failed to unblock');
            }
          },
        },
      ],
    );
  }

  function handleSearchRowTap(user: User) {
    // If already a contact, go to their profile
    const existingContact = contacts.find((c) => c.user.id === user.id);
    if (existingContact) {
      navigation.navigate('ContactProfile', {
        contactId: existingContact.contactId,
        otherUser: user,
        relationshipType: existingContact.relationshipType,
      });
      return;
    }
    navigation.navigate('UserProfile', { user });
  }

  if (isFirstLoad && contacts.length === 0 && pending.length === 0) {
    return <ContactSkeleton />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search users..."
          style={styles.searchInput}
          placeholderTextColor={colors.gray400}
        />
      </View>

      {searching && searchResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {searchResults.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userRow}
              onPress={() => handleSearchRowTap(user)}
            >
              <Avatar uri={user.avatarUrl} name={user.displayName} color={user.avatarColor} size={44} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.displayName}</Text>
                <Text style={styles.userHandle}>@{user.username}</Text>
              </View>
              <TouchableOpacity onPress={() => handleSendRequest(user.id)}>
                <Text style={styles.addText}>Add</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={[]}
        keyExtractor={() => 'list'}
        renderItem={null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            {pending.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Friend Requests ({pending.length})</Text>
                {pending.map((req) => (
                  <View key={req.contactId} style={styles.userRow}>
                    <Avatar
                      uri={req.from.avatarUrl}
                      name={req.from.displayName}
                      color={req.from.avatarColor}
                      size={44}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{req.from.displayName}</Text>
                      <Text style={styles.userHandle}>@{req.from.username}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleAccept(req.contactId)} style={styles.acceptButton}>
                      <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReject(req.contactId)} style={styles.declineButton}>
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contacts ({contacts.length})</Text>
              {contacts.length === 0 && (
                <Text style={styles.emptyText}>No contacts yet. Search for users above!</Text>
              )}
              {contacts.map((contact) => (
                <TouchableOpacity
                  key={contact.contactId}
                  style={styles.userRow}
                  onPress={() =>
                    navigation.navigate('ContactProfile', {
                      contactId: contact.contactId,
                      otherUser: contact.user,
                      relationshipType: contact.relationshipType,
                    })
                  }
                >
                  <Avatar
                    uri={contact.user.avatarUrl}
                    name={contact.nickname || contact.user.displayName}
                    color={contact.user.avatarColor}
                    size={48}
                    isOnline={onlineUserIds.has(contact.user.id)}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {contact.nickname || contact.user.displayName}
                    </Text>
                    <Text style={styles.userHandle}>
                      {onlineUserIds.has(contact.user.id)
                        ? 'Active now'
                        : contact.user.bio || getPresenceString(false, contact.user.lastSeenAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {blockedUsers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Blocked ({blockedUsers.length})</Text>
                {blockedUsers.map((user) => (
                  <View key={user.id} style={styles.userRow}>
                    <Avatar uri={user.avatarUrl} name={user.displayName} color={user.avatarColor} size={44} />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.displayName}</Text>
                      <Text style={styles.userHandle}>@{user.username}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleUnblock(user)} style={styles.unblockButton}>
                      <Text style={styles.unblockText}>Unblock</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        }
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    searchInput: {
      backgroundColor: colors.gray50,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      fontSize: 16,
      color: colors.dark,
    },
    section: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    sectionTitle: {
      fontSize: 12,
      color: colors.gray400,
      marginBottom: 8,
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.dark,
    },
    userHandle: {
      fontSize: 14,
      color: colors.gray400,
      marginTop: 1,
    },
    addText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    acceptButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 8,
    },
    acceptText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    declineButton: {
      backgroundColor: colors.gray100,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    declineText: {
      color: colors.gray500,
      fontSize: 14,
    },
    unblockButton: {
      borderWidth: 1,
      borderColor: colors.gray300,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    unblockText: {
      color: colors.gray500,
      fontSize: 14,
    },
    emptyText: {
      color: colors.gray400,
      textAlign: 'center',
      paddingVertical: 32,
      fontSize: 15,
    },
  });
}
