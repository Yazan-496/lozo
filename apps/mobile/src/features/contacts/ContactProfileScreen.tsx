import { useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Avatar } from '../../shared/components/Avatar';
import { SearchBar } from '../chat/components/SearchBar';
import { SearchResults } from '../chat/components/SearchResults';
import { useThemeColors } from '../../shared/hooks/useThemeColors';
import type { ThemeColors } from '../../shared/utils/theme';
import type { RootStackParamList } from '../../shared/types';
import { useContactProfile } from './hooks/useContactProfile';

interface Props {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<RootStackParamList, 'ContactProfile'>;
}

export function ContactProfileScreen({ route, navigation }: Props) {
    const colors = useThemeColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const {
        contact,
        loading,
        saving,
        relationshipType,
        nicknameModal,
        setNicknameModal,
        chatSearchVisible,
        setChatSearchVisible,
        setChatSearchQuery,
        chatSearchQuery,
        chatSearchResults,
        searchingChat,
        profileUser,
        isOnline,
        presenceText,
        displayName,
        relationshipEmoji,
        handleSetRelationshipType,
        handleOpenChat,
        handleOpenMediaGallery,
        handleOpenChatSearch,
        handleSearchInChat,
        handleChatSearchSelect,
        handleRemoveContact,
        handleBlockContact,
        handleDeleteConversationForMe,
        handleDeleteConversationForEveryone,
        handleSaveNickname,
        handleSaveMyNickname,
    } = useContactProfile({ route, navigation });

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!contact) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <Text style={styles.errorText}>Contact not found</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.headerSection}>
                    <Avatar
                        uri={profileUser.avatarUrl}
                        name={displayName}
                        color={profileUser.avatarColor}
                        size={80}
                        isOnline={isOnline}
                    />
                    <Text style={styles.displayName}>{displayName}</Text>
                    <Text style={styles.username}>@{profileUser.username}</Text>
                    <View style={styles.presenceRow}>
                        <View
                            style={[
                                styles.onlineDot,
                                { backgroundColor: isOnline ? colors.primary : colors.gray400 },
                            ]}
                        />
                        <Text style={styles.presenceText}>{presenceText}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.relationshipBadge, { backgroundColor: colors.bgSecondary }]}
                        onPress={() => {
                            Alert.alert('Relationship Type', '', [
                                {
                                    text: ' Friend',
                                    onPress: () => handleSetRelationshipType('friend'),
                                },
                                {
                                    text: ' Lover',
                                    onPress: () => handleSetRelationshipType('lover'),
                                },
                                { text: 'Cancel' },
                            ]);
                        }}
                        disabled={saving}
                    >
                        <Text style={styles.relationshipText}>
                            {relationshipEmoji}{' '}
                            {relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1)}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nicknames</Text>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() =>
                            setNicknameModal({
                                visible: true,
                                field: 'nickname',
                                value: contact.nickname || '',
                            })
                        }
                        disabled={saving}
                    >
                        <View style={styles.rowContent}>
                            <Text style={styles.rowLabel}>Contact's nickname</Text>
                            <Text style={styles.rowValue}>{contact.nickname || 'Add nickname'}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.row}
                        onPress={() =>
                            setNicknameModal({
                                visible: true,
                                field: 'myNickname',
                                value: contact.myNickname || '',
                            })
                        }
                        disabled={saving}
                    >
                        <View style={styles.rowContent}>
                            <Text style={styles.rowLabel}>My nickname</Text>
                            <Text style={styles.rowValue}>{contact.myNickname || 'Add nickname'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick actions</Text>

                    <TouchableOpacity
                        style={[styles.primaryAction, { backgroundColor: colors.primary }]}
                        onPress={handleOpenChat}
                        disabled={saving}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.primaryActionText}>Open chat</Text>
                    </TouchableOpacity>

                    <View style={styles.quickGrid}>
                        <TouchableOpacity
                            style={[styles.quickCard, { backgroundColor: colors.bgSecondary }]}
                            onPress={handleOpenChatSearch}
                            disabled={saving}
                        >
                            <Ionicons name="search-outline" size={18} color={colors.dark} />
                            <Text style={[styles.quickCardText, { color: colors.dark }]}>Search in chat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickCard, { backgroundColor: colors.bgSecondary }]}
                            onPress={handleOpenMediaGallery}
                            disabled={saving}
                        >
                            <Ionicons name="images-outline" size={18} color={colors.dark} />
                            <Text style={[styles.quickCardText, { color: colors.dark }]}>Media gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickCard, { backgroundColor: colors.bgSecondary }]}
                            onPress={handleDeleteConversationForMe}
                            disabled={saving}
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.dark} />
                            <Text style={[styles.quickCardText, { color: colors.dark }]}>Delete for me</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickCard, { backgroundColor: '#FEECEC' }]}
                            onPress={handleDeleteConversationForEveryone}
                            disabled={saving}
                        >
                            <Ionicons name="warning-outline" size={18} color="#F44336" />
                            <Text style={[styles.quickCardText, { color: '#F44336' }]}>Delete for everyone</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.secondaryAction, { borderColor: colors.border }]}
                        onPress={handleRemoveContact}
                        disabled={saving}
                    >
                        <Text style={[styles.secondaryActionText, { color: colors.dark }]}>Remove contact</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryAction, styles.dangerOutline]}
                        onPress={handleBlockContact}
                        disabled={saving}
                    >
                        <Text style={[styles.secondaryActionText, { color: '#F44336' }]}>Block user</Text>
                    </TouchableOpacity>
                </View>

                <Modal
                    visible={nicknameModal.visible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setNicknameModal((s) => ({ ...s, visible: false }))}
                >
                    <KeyboardAvoidingView
                        style={styles.modalOverlay}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <View style={[styles.modalBox, { backgroundColor: colors.bg }]}>
                            <Text style={[styles.modalTitle, { color: colors.dark }]}>
                                {nicknameModal.field === 'nickname'
                                    ? 'Set nickname'
                                    : 'Set my nickname'}
                            </Text>
                            <Text style={[styles.modalSubtitle, { color: colors.gray500 }]}>
                                {nicknameModal.field === 'nickname'
                                    ? 'What do you call them?'
                                    : 'What do you want them to call you?'}
                            </Text>
                            <TextInput
                                style={[
                                    styles.modalInput,
                                    {
                                        color: colors.dark,
                                        borderColor: colors.border,
                                        backgroundColor: colors.bgSecondary,
                                    },
                                ]}
                                value={nicknameModal.value}
                                onChangeText={(text) =>
                                    setNicknameModal((s) => ({ ...s, value: text }))
                                }
                                autoFocus
                                placeholder="Enter nickname..."
                                placeholderTextColor={colors.gray400}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalCancel}
                                    onPress={() =>
                                        setNicknameModal((s) => ({ ...s, visible: false }))
                                    }
                                >
                                    <Text style={[styles.modalCancelText, { color: colors.gray500 }]}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalSave, { backgroundColor: colors.primary }]}
                                    onPress={() => {
                                        const val = nicknameModal.value.trim() || null;
                                        setNicknameModal((s) => ({ ...s, visible: false }));
                                        if (nicknameModal.field === 'nickname') {
                                            handleSaveNickname(val);
                                        } else {
                                            handleSaveMyNickname(val);
                                        }
                                    }}
                                >
                                    <Text style={styles.modalSaveText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </ScrollView>

            <Modal
                visible={chatSearchVisible}
                animationType="slide"
                onRequestClose={() => setChatSearchVisible(false)}
            >
                <View style={[styles.searchModalContainer, { backgroundColor: colors.bg }]}>
                    <SearchBar
                        onSearch={handleSearchInChat}
                        onClose={() => {
                            setChatSearchVisible(false);
                            setChatSearchQuery('');
                        }}
                    />
                    <SearchResults
                        results={chatSearchResults}
                        query={chatSearchQuery}
                        onSelect={handleChatSearchSelect}
                    />
                    {searchingChat && (
                        <ActivityIndicator style={styles.searchLoader} color={colors.primary} />
                    )}
                </View>
            </Modal>
        </>
    );
}

function makeStyles(colors: ThemeColors) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.bg,
        },
        errorText: {
            fontSize: 16,
            color: colors.gray500,
            textAlign: 'center',
        },
        headerSection: {
            alignItems: 'center',
            paddingVertical: 24,
            paddingHorizontal: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
        },
        displayName: {
            fontSize: 22,
            fontWeight: '700',
            color: colors.dark,
            marginTop: 16,
        },
        username: {
            fontSize: 14,
            color: colors.gray500,
            marginTop: 4,
        },
        presenceRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
        },
        onlineDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginRight: 6,
        },
        presenceText: {
            fontSize: 14,
            color: colors.gray500,
        },
        relationshipBadge: {
            marginTop: 12,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
        },
        relationshipText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.dark,
        },
        section: {
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.dark,
            marginBottom: 12,
        },
        row: {
            paddingVertical: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
        },
        rowContent: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        rowLabel: {
            fontSize: 14,
            color: colors.dark,
        },
        rowValue: {
            fontSize: 14,
            color: colors.primary,
        },
        primaryAction: {
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            marginBottom: 12,
        },
        primaryActionText: {
            fontSize: 16,
            fontWeight: '700',
            color: '#FFFFFF',
        },
        quickGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 12,
        },
        quickCard: {
            width: '48.5%',
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 10,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
        },
        quickCardText: {
            fontSize: 13,
            fontWeight: '600',
            textAlign: 'center',
        },
        secondaryAction: {
            paddingVertical: 12,
            borderRadius: 10,
            borderWidth: 1,
            alignItems: 'center',
            marginBottom: 8,
        },
        secondaryActionText: {
            fontSize: 14,
            fontWeight: '600',
        },
        dangerOutline: {
            borderColor: '#F44336',
        },
        searchModalContainer: {
            flex: 1,
        },
        searchLoader: {
            marginVertical: 12,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            paddingHorizontal: 32,
        },
        modalBox: {
            borderRadius: 12,
            padding: 20,
        },
        modalTitle: {
            fontSize: 17,
            fontWeight: '700',
            marginBottom: 4,
        },
        modalSubtitle: {
            fontSize: 14,
            marginBottom: 16,
        },
        modalInput: {
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 16,
            marginBottom: 16,
        },
        modalActions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 12,
        },
        modalCancel: {
            paddingVertical: 8,
            paddingHorizontal: 16,
        },
        modalCancelText: {
            fontSize: 15,
            fontWeight: '500',
        },
        modalSave: {
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 8,
        },
        modalSaveText: {
            fontSize: 15,
            fontWeight: '600',
            color: '#FFFFFF',
        },
    });
}
