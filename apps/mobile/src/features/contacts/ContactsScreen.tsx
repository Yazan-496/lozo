import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Avatar } from '../../shared/components/Avatar';
import { api } from '../../shared/services/api';
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

  async function loadData() {
    try {
      const [contactsRes, pendingRes] = await Promise.all([
        api.get<Contact[]>('/contacts'),
        api.get<PendingRequest[]>('/contacts/pending'),
      ]);
      setContacts(contactsRes.data);
      setPending(pendingRes.data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
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
      Alert.alert('Sent', 'Friend request sent!');
      setSearchQuery('');
      setSearchResults([]);
      setSearching(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send request');
    }
  }

  async function handleAccept(contactId: string) {
    try {
      await api.post(`/contacts/accept/${contactId}`);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed');
    }
  }

  async function handleReject(contactId: string) {
    try {
      await api.post(`/contacts/reject/${contactId}`);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed');
    }
  }

  async function openChat(userId: string, user: User) {
    try {
      const { data } = await api.post(`/chat/conversations/${userId}`);
      navigation.navigate('Chat', { conversationId: data.id, user });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed');
    }
  }

  return (
    <View className="flex-1 bg-white">
      {/* Search bar */}
      <View className="px-4 py-2">
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search users..."
          className="bg-gray-50 px-4 py-2.5 rounded-full text-base"
          placeholderTextColor="#8A8D91"
        />
      </View>

      {/* Search results */}
      {searching && searchResults.length > 0 && (
        <View className="px-4 pb-2">
          <Text className="text-xs text-gray-400 mb-2 uppercase">Search Results</Text>
          {searchResults.map((user) => (
            <TouchableOpacity
              key={user.id}
              className="flex-row items-center py-2"
              onPress={() => handleSendRequest(user.id)}
            >
              <Avatar
                uri={user.avatarUrl}
                name={user.displayName}
                color={user.avatarColor}
                size={44}
              />
              <View className="flex-1 ml-3">
                <Text className="text-base font-medium text-dark">{user.displayName}</Text>
                <Text className="text-sm text-gray-400">@{user.username}</Text>
              </View>
              <Text className="text-primary text-sm font-medium">Add</Text>
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
              <View className="px-4 pb-2">
                <Text className="text-xs text-gray-400 mb-2 uppercase">
                  Friend Requests ({pending.length})
                </Text>
                {pending.map((req) => (
                  <View key={req.contactId} className="flex-row items-center py-2">
                    <Avatar
                      uri={req.from.avatarUrl}
                      name={req.from.displayName}
                      color={req.from.avatarColor}
                      size={44}
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-base font-medium text-dark">
                        {req.from.displayName}
                      </Text>
                      <Text className="text-sm text-gray-400">@{req.from.username}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleAccept(req.contactId)}
                      className="bg-primary px-4 py-1.5 rounded-full mr-2"
                    >
                      <Text className="text-white text-sm font-medium">Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleReject(req.contactId)}
                      className="bg-gray-100 px-3 py-1.5 rounded-full"
                    >
                      <Text className="text-gray-500 text-sm">Decline</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Contacts list */}
            <View className="px-4">
              <Text className="text-xs text-gray-400 mb-2 uppercase">
                Contacts ({contacts.length})
              </Text>
              {contacts.length === 0 && (
                <Text className="text-gray-400 text-center py-8">
                  No contacts yet. Search for users above!
                </Text>
              )}
              {contacts.map((contact) => (
                <TouchableOpacity
                  key={contact.contactId}
                  className="flex-row items-center py-2"
                  onPress={() => openChat(contact.user.id, contact.user)}
                >
                  <Avatar
                    uri={contact.user.avatarUrl}
                    name={contact.nickname || contact.user.displayName}
                    color={contact.user.avatarColor}
                    size={48}
                    isOnline={contact.user.isOnline}
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-medium text-dark">
                      {contact.nickname || contact.user.displayName}
                    </Text>
                    <Text className="text-sm text-gray-400">
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
