import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../shared/components/Avatar';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { useToast } from '../../shared/components/Toast';
import { api } from '../../shared/services/api';
import { useAuthStore } from '../../shared/stores/auth';
import { disconnectSocket } from '../../shared/services/socket';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../shared/utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const { showToast } = useToast();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
      showToast('error', err.response?.data?.error || 'Failed to update');
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

  const menuItems = [
    {
      label: 'Edit Profile',
      icon: 'person-outline' as const,
      onPress: () => setEditing(true),
    },
    {
      label: 'Settings',
      icon: 'settings-outline' as const,
      onPress: () => navigation.navigate('Settings'),
    },
    {
      label: 'Change Password',
      icon: 'lock-closed-outline' as const,
      onPress: () => showToast('info', 'Coming soon'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar
          uri={user.avatarUrl}
          name={user.displayName}
          color={user.avatarColor}
          size={96}
        />
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      </View>

      <View style={styles.content}>
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
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.6}
              >
                <Ionicons name={item.icon} size={20} color={colors.gray500} style={styles.menuIcon} />
                <Text style={styles.menuText}>{item.label}</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
              activeOpacity={0.6}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.red} style={styles.menuIcon} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgSecondary,
    },
    header: {
      alignItems: 'center',
      paddingTop: 32,
      paddingBottom: 24,
      backgroundColor: colors.bg,
      marginBottom: 16,
    },
    displayName: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.dark,
      marginTop: 12,
    },
    username: {
      fontSize: 15,
      color: colors.gray400,
      marginTop: 2,
    },
    bio: {
      fontSize: 15,
      color: colors.gray500,
      marginTop: 6,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    content: {
      paddingHorizontal: 16,
    },
    menuItem: {
      backgroundColor: colors.bg,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuIcon: {
      marginRight: 12,
    },
    menuText: {
      fontSize: 16,
      color: colors.dark,
      flex: 1,
    },
    menuArrow: {
      fontSize: 20,
      color: colors.gray400,
      fontWeight: '600',
    },
    logoutItem: {
      marginTop: 8,
    },
    logoutText: {
      fontSize: 16,
      color: colors.red,
      flex: 1,
    },
  });
}
