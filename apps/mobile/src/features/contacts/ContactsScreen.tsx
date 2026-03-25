import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar } from '../../shared/components/Avatar';
import { ContactSkeleton } from '../../shared/components/ContactSkeleton';
import { useToast } from '../../shared/components/Toast';
import { api } from '../../shared/services/api';
import { colors } from '../../shared/utils/theme';
import type { Contact, PendingRequest, User } from '../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function ContactsScreen({ navigation }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const { showToast } = useToast();

  async function loadData() {
    try {
      const [contactsRes, pendingRes] = await Promise.all([
        api.get<Contact[]>('/contacts'),
        api.get<PendingRequest[]>('/contacts/pending'),
      ]);
      setContacts(contactsRes.data);
      setPending(pendingRes.data);
      if (isFirstLoad) setIsFirstLoad(false);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      if (isFirstLoad) setIsFirstLoad(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

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

  async function openChat(userId: string, user: User) {
    try {
      const { data } = await api.post(`/chat/conversations/${userId}`);
      navigation.navigate('Chat', { conversationId: data.id, user });
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Failed');
    }
  }

  if (isFirstLoad && contacts.length === 0 && pending.length === 0) {
    return <ContactSkeleton />;
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search users..."
          style={styles.searchInput}
          placeholderTextColor={colors.gray400}
        />
      </View>

      {/* Search results */}
      {searching && searchResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {searchResults.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userRow}
              onPress={() => handleSendRequest(user.id)}
            >
              <Avatar
                uri={user.avatarUrl}
                name={user.displayName}
                color={user.avatarColor}
                size={44}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.displayName}</Text>
                <Text style={styles.userHandle}>@{user.username}</Text>
              </View>
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={[]}
        keyExtractor={() => 'list'}
        renderItem={null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* Pending requests */}
            {pending.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Friend Requests ({pending.length})
                </Text>
                {pending.map((req) => (
                  <View key={req.contactId} style={styles.userRow}>
                    <Avatar
                      uri={req.from.avatarUrl}
                      name={req.from.displayName}
                      color={req.from.avatarColor}
                      size={44}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>
                        {req.from.displayName}
                      </Text>
                      <Text style={styles.userHandle}>@{req.from.username}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleAccept(req.contactId)}
                      style={styles.acceptButton}
                    >
                      <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleReject(req.contactId)}
                      style={styles.declineButton}
                    >
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Contacts list */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Contacts ({contacts.length})
              </Text>
              {contacts.length === 0 && (
                <Text style={styles.emptyText}>
                  No contacts yet. Search for users above!
                </Text>
              )}
              {contacts.map((contact) => (
                <TouchableOpacity
                  key={contact.contactId}
                  style={styles.userRow}
                  onPress={() => openChat(contact.user.id, contact.user)}
                >
                  <Avatar
                    uri={contact.user.avatarUrl}
                    name={contact.nickname || contact.user.displayName}
                    color={contact.user.avatarColor}
                    size={48}
                    isOnline={contact.user.isOnline}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {contact.nickname || contact.user.displayName}
                    </Text>
                    <Text style={styles.userHandle}>
                      {contact.user.isOnline ? 'Online' : contact.user.bio}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
    color: colors.white,
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
  emptyText: {
    color: colors.gray400,
    textAlign: 'center',
    paddingVertical: 32,
    fontSize: 15,
  },
});
