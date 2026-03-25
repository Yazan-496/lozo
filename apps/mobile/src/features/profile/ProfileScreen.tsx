import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Avatar } from '../../shared/components/Avatar';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { api } from '../../shared/services/api';
import { useAuthStore } from '../../shared/stores/auth';
import { disconnectSocket } from '../../shared/services/socket';

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', { displayName, bio });
      setUser(data);
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          disconnectSocket();
          logout();
        },
      },
    ]);
  }

  if (!user) return null;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="items-center pt-8 pb-6">
        <Avatar
          uri={user.avatarUrl}
          name={user.displayName}
          color={user.avatarColor}
          size={96}
        />
        <Text className="text-xl font-bold text-dark mt-3">{user.displayName}</Text>
        <Text className="text-gray-400">@{user.username}</Text>
        <Text className="text-gray-500 mt-1">{user.bio}</Text>
      </View>

      <View className="px-6">
        {editing ? (
          <>
            <Input
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            <Input
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="About you..."
              autoCapitalize="sentences"
            />
            <Button title="Save" onPress={handleSave} loading={loading} />
            <Button
              title="Cancel"
              onPress={() => {
                setEditing(false);
                setDisplayName(user.displayName);
                setBio(user.bio);
              }}
              variant="ghost"
            />
          </>
        ) : (
          <>
            <TouchableOpacity
              className="bg-gray-50 px-4 py-3.5 rounded-xl mb-3"
              onPress={() => setEditing(true)}
            >
              <Text className="text-base text-dark">Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-50 px-4 py-3.5 rounded-xl mb-3"
              onPress={() => {
                Alert.alert('Coming Soon', 'Change password feature');
              }}
            >
              <Text className="text-base text-dark">Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-50 px-4 py-3.5 rounded-xl mb-6"
              onPress={handleLogout}
            >
              <Text className="text-base text-red-500">Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}
