"use strict";
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
exports.ContactsScreen = ContactsScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var native_1 = require("@react-navigation/native");
var Avatar_1 = require("../../shared/components/Avatar");
var ContactSkeleton_1 = require("../../shared/components/ContactSkeleton");
var Toast_1 = require("../../shared/components/Toast");
var api_1 = require("../../shared/services/api");
var presence_1 = require("../../shared/stores/presence");
var notifications_1 = require("../../shared/stores/notifications");
var useThemeColors_1 = require("../../shared/hooks/useThemeColors");
var presence_2 = require("../../shared/utils/presence");
function ContactsScreen(_a) {
    var navigation = _a.navigation;
    var _b = (0, react_1.useState)([]), contacts = _b[0], setContacts = _b[1];
    var _c = (0, react_1.useState)([]), pending = _c[0], setPending = _c[1];
    var _d = (0, react_1.useState)([]), blockedUsers = _d[0], setBlockedUsers = _d[1];
    var _e = (0, react_1.useState)(''), searchQuery = _e[0], setSearchQuery = _e[1];
    var _f = (0, react_1.useState)([]), searchResults = _f[0], setSearchResults = _f[1];
    var _g = (0, react_1.useState)(false), refreshing = _g[0], setRefreshing = _g[1];
    var _h = (0, react_1.useState)(false), searching = _h[0], setSearching = _h[1];
    var _j = (0, react_1.useState)(true), isFirstLoad = _j[0], setIsFirstLoad = _j[1];
    var showToast = (0, Toast_1.useToast)().showToast;
    var onlineUserIds = (0, presence_1.usePresenceStore)(function (s) { return s.onlineUserIds; });
    var setPendingCount = (0, notifications_1.useNotificationsStore)(function (s) { return s.setPendingRequestsCount; });
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    function loadData() {
        return __awaiter(this, void 0, void 0, function () {
            var _a, contactsRes, pendingRes, blockedRes, err_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
                                api_1.api.get('/contacts'),
                                api_1.api.get('/contacts/pending'),
                                api_1.contactsApi.getBlockedUsers().catch(function () { return ({ data: [] }); }),
                            ])];
                    case 1:
                        _a = _c.sent(), contactsRes = _a[0], pendingRes = _a[1], blockedRes = _a[2];
                        setContacts(contactsRes.data);
                        setPending(pendingRes.data);
                        setBlockedUsers((_b = blockedRes.data) !== null && _b !== void 0 ? _b : []);
                        setPendingCount(pendingRes.data.length);
                        if (isFirstLoad)
                            setIsFirstLoad(false);
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _c.sent();
                        console.error('Failed to load contacts:', err_1);
                        if (isFirstLoad)
                            setIsFirstLoad(false);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    (0, native_1.useFocusEffect)((0, react_1.useCallback)(function () { loadData(); }, []));
    function onRefresh() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setRefreshing(true);
                        return [4 /*yield*/, loadData()];
                    case 1:
                        _a.sent();
                        setRefreshing(false);
                        return [2 /*return*/];
                }
            });
        });
    }
    function handleSearch(query) {
        return __awaiter(this, void 0, void 0, function () {
            var data, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setSearchQuery(query);
                        if (query.length < 2) {
                            setSearchResults([]);
                            setSearching(false);
                            return [2 /*return*/];
                        }
                        setSearching(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, api_1.api.get("/contacts/search?q=".concat(query))];
                    case 2:
                        data = (_b.sent()).data;
                        setSearchResults(data);
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        setSearchResults([]);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function handleSendRequest(userId) {
        return __awaiter(this, void 0, void 0, function () {
            var err_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, api_1.api.post("/contacts/request/".concat(userId))];
                    case 1:
                        _c.sent();
                        showToast('success', 'Friend request sent!');
                        setSearchQuery('');
                        setSearchResults([]);
                        setSearching(false);
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _c.sent();
                        showToast('error', ((_b = (_a = err_2.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to send request');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function handleAccept(contactId) {
        return __awaiter(this, void 0, void 0, function () {
            var err_3;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, api_1.api.post("/contacts/accept/".concat(contactId))];
                    case 1:
                        _c.sent();
                        loadData();
                        return [3 /*break*/, 3];
                    case 2:
                        err_3 = _c.sent();
                        showToast('error', ((_b = (_a = err_3.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function handleReject(contactId) {
        return __awaiter(this, void 0, void 0, function () {
            var err_4;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, api_1.api.post("/contacts/reject/".concat(contactId))];
                    case 1:
                        _c.sent();
                        loadData();
                        return [3 /*break*/, 3];
                    case 2:
                        err_4 = _c.sent();
                        showToast('error', ((_b = (_a = err_4.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function handleUnblock(user) {
        var _this = this;
        react_native_1.Alert.alert("Unblock ".concat(user.displayName, "?"), 'Unblocking will not restore the contact relationship.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Unblock',
                onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, api_1.contactsApi.unblockUser(user.id)];
                            case 1:
                                _b.sent();
                                showToast('success', 'User unblocked');
                                loadData();
                                return [3 /*break*/, 3];
                            case 2:
                                _a = _b.sent();
                                showToast('error', 'Failed to unblock');
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); },
            },
        ]);
    }
    function handleSearchRowTap(user) {
        // If already a contact, go to their profile
        var existingContact = contacts.find(function (c) { return c.user.id === user.id; });
        if (existingContact) {
            navigation.navigate('ContactProfile', {
                contactId: existingContact.contactId,
                otherUser: user,
                relationshipType: existingContact.relationshipType,
            });
            return;
        }
        navigation.navigate('UserProfile', { user: user });
    }
    if (isFirstLoad && contacts.length === 0 && pending.length === 0) {
        return <ContactSkeleton_1.ContactSkeleton />;
    }
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.searchContainer}>
        <react_native_1.TextInput value={searchQuery} onChangeText={handleSearch} placeholder="Search users..." style={styles.searchInput} placeholderTextColor={colors.gray400}/>
      </react_native_1.View>

      {searching && searchResults.length > 0 && (<react_native_1.View style={styles.section}>
          <react_native_1.Text style={styles.sectionTitle}>Search Results</react_native_1.Text>
          {searchResults.map(function (user) { return (<react_native_1.TouchableOpacity key={user.id} style={styles.userRow} onPress={function () { return handleSearchRowTap(user); }}>
              <Avatar_1.Avatar uri={user.avatarUrl} name={user.displayName} color={user.avatarColor} size={44}/>
              <react_native_1.View style={styles.userInfo}>
                <react_native_1.Text style={styles.userName}>{user.displayName}</react_native_1.Text>
                <react_native_1.Text style={styles.userHandle}>@{user.username}</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.TouchableOpacity onPress={function () { return handleSendRequest(user.id); }}>
                <react_native_1.Text style={styles.addText}>Add</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.TouchableOpacity>); })}
        </react_native_1.View>)}

      <react_native_1.FlatList data={[]} keyExtractor={function () { return 'list'; }} renderItem={null} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>} ListHeaderComponent={<>
            {pending.length > 0 && (<react_native_1.View style={styles.section}>
                <react_native_1.Text style={styles.sectionTitle}>Friend Requests ({pending.length})</react_native_1.Text>
                {pending.map(function (req) { return (<react_native_1.View key={req.contactId} style={styles.userRow}>
                    <Avatar_1.Avatar uri={req.from.avatarUrl} name={req.from.displayName} color={req.from.avatarColor} size={44}/>
                    <react_native_1.View style={styles.userInfo}>
                      <react_native_1.Text style={styles.userName}>{req.from.displayName}</react_native_1.Text>
                      <react_native_1.Text style={styles.userHandle}>@{req.from.username}</react_native_1.Text>
                    </react_native_1.View>
                    <react_native_1.TouchableOpacity onPress={function () { return handleAccept(req.contactId); }} style={styles.acceptButton}>
                      <react_native_1.Text style={styles.acceptText}>Accept</react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                    <react_native_1.TouchableOpacity onPress={function () { return handleReject(req.contactId); }} style={styles.declineButton}>
                      <react_native_1.Text style={styles.declineText}>Decline</react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                  </react_native_1.View>); })}
              </react_native_1.View>)}

            <react_native_1.View style={styles.section}>
              <react_native_1.Text style={styles.sectionTitle}>Contacts ({contacts.length})</react_native_1.Text>
              {contacts.length === 0 && (<react_native_1.Text style={styles.emptyText}>No contacts yet. Search for users above!</react_native_1.Text>)}
              {contacts.map(function (contact) { return (<react_native_1.TouchableOpacity key={contact.contactId} style={styles.userRow} onPress={function () {
                    return navigation.navigate('ContactProfile', {
                        contactId: contact.contactId,
                        otherUser: contact.user,
                        relationshipType: contact.relationshipType,
                    });
                }}>
                  <Avatar_1.Avatar uri={contact.user.avatarUrl} name={contact.nickname || contact.user.displayName} color={contact.user.avatarColor} size={48} isOnline={onlineUserIds.has(contact.user.id)}/>
                  <react_native_1.View style={styles.userInfo}>
                    <react_native_1.Text style={styles.userName}>
                      {contact.nickname || contact.user.displayName}
                    </react_native_1.Text>
                    <react_native_1.Text style={styles.userHandle}>
                      {onlineUserIds.has(contact.user.id)
                    ? 'Active now'
                    : contact.user.bio || (0, presence_2.getPresenceString)(false, contact.user.lastSeenAt)}
                    </react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.TouchableOpacity>); })}
            </react_native_1.View>

            {blockedUsers.length > 0 && (<react_native_1.View style={styles.section}>
                <react_native_1.Text style={styles.sectionTitle}>Blocked ({blockedUsers.length})</react_native_1.Text>
                {blockedUsers.map(function (user) { return (<react_native_1.View key={user.id} style={styles.userRow}>
                    <Avatar_1.Avatar uri={user.avatarUrl} name={user.displayName} color={user.avatarColor} size={44}/>
                    <react_native_1.View style={styles.userInfo}>
                      <react_native_1.Text style={styles.userName}>{user.displayName}</react_native_1.Text>
                      <react_native_1.Text style={styles.userHandle}>@{user.username}</react_native_1.Text>
                    </react_native_1.View>
                    <react_native_1.TouchableOpacity onPress={function () { return handleUnblock(user); }} style={styles.unblockButton}>
                      <react_native_1.Text style={styles.unblockText}>Unblock</react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                  </react_native_1.View>); })}
              </react_native_1.View>)}
          </>}/>
    </react_native_1.View>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
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
