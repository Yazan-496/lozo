"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactProfileScreen = ContactProfileScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var native_1 = require("@react-navigation/native");
var Avatar_1 = require("../../shared/components/Avatar");
var Toast_1 = require("../../shared/components/Toast");
var api_1 = require("../../shared/services/api");
var presence_1 = require("../../shared/stores/presence");
var conversations_1 = require("../../shared/stores/conversations");
var useThemeColors_1 = require("../../shared/hooks/useThemeColors");
var presence_2 = require("../../shared/utils/presence");
function ContactProfileScreen(_a) {
    var _this = this;
    var route = _a.route, navigation = _a.navigation;
    var _b = route.params, contactId = _b.contactId, otherUser = _b.otherUser, initialRelationshipType = _b.relationshipType;
    var _c = (0, react_1.useState)(null), contact = _c[0], setContact = _c[1];
    var _d = (0, react_1.useState)(true), loading = _d[0], setLoading = _d[1];
    var _e = (0, react_1.useState)(false), saving = _e[0], setSaving = _e[1];
    var _f = (0, react_1.useState)(initialRelationshipType || 'friend'), relationshipType = _f[0], setRelationshipType = _f[1];
    // Nickname modal state
    var _g = (0, react_1.useState)({ visible: false, field: 'nickname', value: '' }), nicknameModal = _g[0], setNicknameModal = _g[1];
    var showToast = (0, Toast_1.useToast)().showToast;
    var onlineUserIds = (0, presence_1.usePresenceStore)(function (s) { return s.onlineUserIds; });
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    function loadContact() {
        return __awaiter(this, void 0, void 0, function () {
            var data, found, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        setLoading(true);
                        return [4 /*yield*/, api_1.contactsApi.getContacts()];
                    case 1:
                        data = (_a.sent()).data;
                        found = data.find(function (c) { return c.contactId === contactId; });
                        if (found) {
                            setContact(found);
                            setRelationshipType(found.relationshipType);
                        }
                        return [3 /*break*/, 4];
                    case 2:
                        err_1 = _a.sent();
                        console.error('Failed to load contact:', err_1);
                        return [3 /*break*/, 4];
                    case 3:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    (0, native_1.useFocusEffect)((0, react_1.useCallback)(function () {
        loadContact();
    }, [contactId]));
    var handleSaveNickname = function (newNickname) { return __awaiter(_this, void 0, void 0, function () {
        var err_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!contact)
                        return [2 /*return*/];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    setSaving(true);
                    return [4 /*yield*/, api_1.contactsApi.setNickname(contactId, newNickname || null)];
                case 2:
                    _c.sent();
                    setContact(__assign(__assign({}, contact), { nickname: newNickname || null }));
                    showToast('success', 'Nickname updated');
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _c.sent();
                    showToast('error', ((_b = (_a = err_2.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to update nickname');
                    return [3 /*break*/, 5];
                case 4:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleSaveMyNickname = function (newMyNickname) { return __awaiter(_this, void 0, void 0, function () {
        var err_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!contact)
                        return [2 /*return*/];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    setSaving(true);
                    return [4 /*yield*/, api_1.contactsApi.setMyNickname(contactId, newMyNickname || null)];
                case 2:
                    _c.sent();
                    setContact(__assign(__assign({}, contact), { myNickname: newMyNickname || null }));
                    showToast('success', 'My nickname updated');
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _c.sent();
                    showToast('error', ((_b = (_a = err_3.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to update my nickname');
                    return [3 /*break*/, 5];
                case 4:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleSetRelationshipType = function (type) { return __awaiter(_this, void 0, void 0, function () {
        var err_4;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, 3, 4]);
                    setSaving(true);
                    return [4 /*yield*/, api_1.contactsApi.setRelationshipType(contactId, type)];
                case 1:
                    _c.sent();
                    setRelationshipType(type);
                    showToast('success', "Relationship updated to ".concat(type));
                    return [3 /*break*/, 4];
                case 2:
                    err_4 = _c.sent();
                    showToast('error', ((_b = (_a = err_4.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to update relationship');
                    return [3 /*break*/, 4];
                case 3:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleOpenChat = function () { return __awaiter(_this, void 0, void 0, function () {
        var conv, err_5;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, api_1.chatApi.getOrCreateConversation(otherUser.id)];
                case 1:
                    conv = (_c.sent()).data;
                    navigation.navigate('Chat', {
                        conversationId: conv.id,
                        otherUser: otherUser,
                        relationshipType: relationshipType,
                        contactId: contactId,
                        nickname: (contact === null || contact === void 0 ? void 0 : contact.nickname) || undefined,
                    });
                    return [3 /*break*/, 3];
                case 2:
                    err_5 = _c.sent();
                    showToast('error', ((_b = (_a = err_5.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to open chat');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleRemoveContact = function () {
        react_native_1.Alert.alert('Remove contact', 'Are you sure?', [
            { text: 'Cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                    var err_6;
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                _c.trys.push([0, 2, 3, 4]);
                                setSaving(true);
                                return [4 /*yield*/, api_1.contactsApi.removeContact(contactId)];
                            case 1:
                                _c.sent();
                                showToast('success', 'Contact removed');
                                navigation.goBack();
                                return [3 /*break*/, 4];
                            case 2:
                                err_6 = _c.sent();
                                showToast('error', ((_b = (_a = err_6.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to remove contact');
                                return [3 /*break*/, 4];
                            case 3:
                                setSaving(false);
                                return [7 /*endfinally*/];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); },
            },
        ]);
    };
    var handleBlockContact = function () {
        react_native_1.Alert.alert("Block ".concat(otherUser.displayName, "?"), "They won't be able to message you or send contact requests.", [
            { text: 'Cancel' },
            {
                text: 'Block',
                style: 'destructive',
                onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                    var err_7;
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                _c.trys.push([0, 2, 3, 4]);
                                setSaving(true);
                                return [4 /*yield*/, api_1.contactsApi.blockContact(otherUser.id)];
                            case 1:
                                _c.sent();
                                showToast('success', 'Contact blocked');
                                navigation.goBack();
                                return [3 /*break*/, 4];
                            case 2:
                                err_7 = _c.sent();
                                showToast('error', ((_b = (_a = err_7.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to block contact');
                                return [3 /*break*/, 4];
                            case 3:
                                setSaving(false);
                                return [7 /*endfinally*/];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); },
            },
        ]);
    };
    var handleDeleteConversationForMe = function () {
        if (!route.params.conversationId) {
            showToast('error', 'Conversation not found');
            return;
        }
        react_native_1.Alert.alert('Delete conversation for me', "This clears your message history only. They won't be affected.", [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                    var err_8;
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                _c.trys.push([0, 2, 3, 4]);
                                setSaving(true);
                                return [4 /*yield*/, api_1.chatApi.deleteConversation(route.params.conversationId, 'me')];
                            case 1:
                                _c.sent();
                                conversations_1.useConversationsStore
                                    .getState()
                                    .addHiddenConversation(route.params.conversationId);
                                showToast('success', 'Conversation deleted');
                                return [3 /*break*/, 4];
                            case 2:
                                err_8 = _c.sent();
                                showToast('error', ((_b = (_a = err_8.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to delete conversation');
                                return [3 /*break*/, 4];
                            case 3:
                                setSaving(false);
                                return [7 /*endfinally*/];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); },
            },
        ]);
    };
    var handleDeleteConversationForEveryone = function () {
        if (!route.params.conversationId) {
            showToast('error', 'Conversation not found');
            return;
        }
        react_native_1.Alert.alert('Delete conversation for everyone', 'This permanently deletes the conversation for both you and them. This cannot be undone.', [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                    var err_9;
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                _c.trys.push([0, 2, 3, 4]);
                                setSaving(true);
                                return [4 /*yield*/, api_1.chatApi.deleteConversation(route.params.conversationId, 'everyone')];
                            case 1:
                                _c.sent();
                                conversations_1.useConversationsStore
                                    .getState()
                                    .addHiddenConversation(route.params.conversationId);
                                showToast('success', 'Conversation deleted for everyone');
                                return [3 /*break*/, 4];
                            case 2:
                                err_9 = _c.sent();
                                showToast('error', ((_b = (_a = err_9.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to delete conversation');
                                return [3 /*break*/, 4];
                            case 3:
                                setSaving(false);
                                return [7 /*endfinally*/];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); },
            },
        ]);
    };
    if (loading) {
        return (<react_native_1.View style={[styles.container, { justifyContent: 'center' }]}>
                <react_native_1.ActivityIndicator size="large" color={colors.primary}/>
            </react_native_1.View>);
    }
    if (!contact) {
        return (<react_native_1.View style={[styles.container, { justifyContent: 'center' }]}>
                <react_native_1.Text style={styles.errorText}>Contact not found</react_native_1.Text>
            </react_native_1.View>);
    }
    var isOnline = onlineUserIds.has(otherUser.id);
    var presenceText = isOnline ? 'Online' : (0, presence_2.getPresenceString)(false, otherUser.lastSeenAt);
    // nickname = what current user calls this contact; myNickname = current user's alias for themselves
    var displayName = contact.nickname || otherUser.displayName;
    var relationshipEmoji = relationshipType === 'friend' ? '💙' : '❤️';
    return (<react_native_1.ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <react_native_1.View style={styles.headerSection}>
                <Avatar_1.Avatar uri={otherUser.avatarUrl} name={displayName} color={otherUser.avatarColor} size={80} isOnline={isOnline}/>
                <react_native_1.Text style={styles.displayName}>{displayName}</react_native_1.Text>
                <react_native_1.Text style={styles.username}>@{otherUser.username}</react_native_1.Text>
                <react_native_1.View style={styles.presenceRow}>
                    <react_native_1.View style={[
            styles.onlineDot,
            { backgroundColor: isOnline ? colors.primary : colors.gray400 },
        ]}/>
                    <react_native_1.Text style={styles.presenceText}>{presenceText}</react_native_1.Text>
                </react_native_1.View>

                {/* Relationship Badge */}
                <react_native_1.TouchableOpacity style={[styles.relationshipBadge, { backgroundColor: colors.bgSecondary }]} onPress={function () {
            react_native_1.Alert.alert('Relationship Type', '', [
                {
                    text: '💙 Friend',
                    onPress: function () { return handleSetRelationshipType('friend'); },
                },
                {
                    text: '❤️ Lover',
                    onPress: function () { return handleSetRelationshipType('lover'); },
                },
                { text: 'Cancel' },
            ]);
        }} disabled={saving}>
                    <react_native_1.Text style={styles.relationshipText}>
                        {relationshipEmoji}{' '}
                        {relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1)}
                    </react_native_1.Text>
                </react_native_1.TouchableOpacity>
            </react_native_1.View>

            {/* Nicknames Section */}
            <react_native_1.View style={styles.section}>
                <react_native_1.Text style={styles.sectionTitle}>Nicknames</react_native_1.Text>

                <react_native_1.TouchableOpacity style={styles.row} onPress={function () {
            return setNicknameModal({
                visible: true,
                field: 'nickname',
                value: contact.nickname || '',
            });
        }} disabled={saving}>
                    <react_native_1.View style={styles.rowContent}>
                        <react_native_1.Text style={styles.rowLabel}>Contact's nickname</react_native_1.Text>
                        <react_native_1.Text style={styles.rowValue}>{contact.nickname || 'Add nickname'}</react_native_1.Text>
                    </react_native_1.View>
                </react_native_1.TouchableOpacity>

                <react_native_1.TouchableOpacity style={styles.row} onPress={function () {
            return setNicknameModal({
                visible: true,
                field: 'myNickname',
                value: contact.myNickname || '',
            });
        }} disabled={saving}>
                    <react_native_1.View style={styles.rowContent}>
                        <react_native_1.Text style={styles.rowLabel}>My nickname</react_native_1.Text>
                        <react_native_1.Text style={styles.rowValue}>{contact.myNickname || 'Add nickname'}</react_native_1.Text>
                    </react_native_1.View>
                </react_native_1.TouchableOpacity>
            </react_native_1.View>

            {/* Actions Section */}
            <react_native_1.View style={styles.section}>
                <react_native_1.Text style={styles.sectionTitle}>Actions</react_native_1.Text>

                <react_native_1.TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleOpenChat} disabled={saving}>
                    <react_native_1.Text style={styles.actionButtonText}>Open Chat</react_native_1.Text>
                </react_native_1.TouchableOpacity>

                {route.params.conversationId && (<>
                        <react_native_1.TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.gray200 }]} onPress={handleDeleteConversationForMe} disabled={saving}>
                            <react_native_1.Text style={[styles.actionButtonText, { color: colors.dark }]}>
                                Delete conversation for me
                            </react_native_1.Text>
                        </react_native_1.TouchableOpacity>

                        <react_native_1.TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.gray200 }]} onPress={handleDeleteConversationForEveryone} disabled={saving}>
                            <react_native_1.Text style={[styles.actionButtonText, { color: colors.dark }]}>
                                Delete conversation for everyone
                            </react_native_1.Text>
                        </react_native_1.TouchableOpacity>
                    </>)}

                <react_native_1.TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.gray200 }]} onPress={handleRemoveContact} disabled={saving}>
                    <react_native_1.Text style={[styles.actionButtonText, { color: colors.dark }]}>
                        Remove contact
                    </react_native_1.Text>
                </react_native_1.TouchableOpacity>

                <react_native_1.TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.red }]} onPress={handleBlockContact} disabled={saving}>
                    <react_native_1.Text style={styles.actionButtonText}>Block</react_native_1.Text>
                </react_native_1.TouchableOpacity>
            </react_native_1.View>
            {/* Nickname edit modal — cross-platform replacement for Alert.prompt */}
            <react_native_1.Modal visible={nicknameModal.visible} transparent animationType="fade" onRequestClose={function () { return setNicknameModal(function (s) { return (__assign(__assign({}, s), { visible: false })); }); }}>
                <react_native_1.KeyboardAvoidingView style={styles.modalOverlay} behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <react_native_1.View style={[styles.modalBox, { backgroundColor: colors.bg }]}>
                        <react_native_1.Text style={[styles.modalTitle, { color: colors.dark }]}>
                            {nicknameModal.field === 'nickname'
            ? 'Set nickname'
            : 'Set my nickname'}
                        </react_native_1.Text>
                        <react_native_1.Text style={[styles.modalSubtitle, { color: colors.gray500 }]}>
                            {nicknameModal.field === 'nickname'
            ? 'What do you call them?'
            : 'What do you want them to call you?'}
                        </react_native_1.Text>
                        <react_native_1.TextInput style={[
            styles.modalInput,
            {
                color: colors.dark,
                borderColor: colors.border,
                backgroundColor: colors.bgSecondary,
            },
        ]} value={nicknameModal.value} onChangeText={function (text) {
            return setNicknameModal(function (s) { return (__assign(__assign({}, s), { value: text })); });
        }} autoFocus placeholder="Enter nickname..." placeholderTextColor={colors.gray400}/>
                        <react_native_1.View style={styles.modalActions}>
                            <react_native_1.TouchableOpacity style={styles.modalCancel} onPress={function () { return setNicknameModal(function (s) { return (__assign(__assign({}, s), { visible: false })); }); }}>
                                <react_native_1.Text style={[styles.modalCancelText, { color: colors.gray500 }]}>
                                    Cancel
                                </react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                            <react_native_1.TouchableOpacity style={[styles.modalSave, { backgroundColor: colors.primary }]} onPress={function () {
            var val = nicknameModal.value.trim() || null;
            setNicknameModal(function (s) { return (__assign(__assign({}, s), { visible: false })); });
            if (nicknameModal.field === 'nickname') {
                handleSaveNickname(val);
            }
            else {
                handleSaveMyNickname(val);
            }
        }}>
                                <react_native_1.Text style={styles.modalSaveText}>Save</react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                        </react_native_1.View>
                    </react_native_1.View>
                </react_native_1.KeyboardAvoidingView>
            </react_native_1.Modal>
        </react_native_1.ScrollView>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
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
        actionButton: {
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 8,
        },
        actionButtonText: {
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
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
