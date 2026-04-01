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
exports.ConversationsScreen = ConversationsScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var native_1 = require("@react-navigation/native");
var Avatar_1 = require("../../shared/components/Avatar");
var ConversationSkeleton_1 = require("../../shared/components/ConversationSkeleton");
var OfflineBanner_1 = require("../../shared/components/OfflineBanner");
var ConversationActionSheet_1 = require("./components/ConversationActionSheet");
var api_1 = require("../../shared/services/api");
var socket_1 = require("../../shared/services/socket");
var auth_1 = require("../../shared/stores/auth");
var presence_1 = require("../../shared/stores/presence");
var notifications_1 = require("../../shared/stores/notifications");
var conversations_1 = require("../../shared/stores/conversations");
var network_1 = require("../../shared/stores/network");
var useThemeColors_1 = require("../../shared/hooks/useThemeColors");
var conversations_db_ts_1 = require("../../shared/db/conversations.db.ts");
function formatTime(dateStr) {
    var date = new Date(dateStr);
    var now = new Date();
    var diff = now.getTime() - date.getTime();
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1)
        return 'Yesterday';
    if (days < 7)
        return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
function getLastMessagePreview(conv) {
    if (!conv.lastMessage)
        return 'No messages yet';
    if (conv.lastMessage.deletedForEveryone)
        return 'Message deleted';
    if (conv.lastMessage.type === 'image')
        return '📷 Photo';
    if (conv.lastMessage.type === 'voice')
        return '🎤 Voice message';
    if (conv.lastMessage.type === 'file')
        return '📎 File';
    return conv.lastMessage.content || '';
}
function ConversationsScreen(_a) {
    var _b;
    var navigation = _a.navigation;
    var _c = (0, react_1.useState)([]), conversations = _c[0], setConversations = _c[1];
    var _d = (0, react_1.useState)({}), contactNicknameMap = _d[0], setContactNicknameMap = _d[1];
    var _e = (0, react_1.useState)({}), contactRelationshipMap = _e[0], setContactRelationshipMap = _e[1];
    var _f = (0, react_1.useState)({}), contactIdMap = _f[0], setContactIdMap = _f[1];
    var _g = (0, react_1.useState)({}), mutedMap = _g[0], setMutedMap = _g[1];
    var _h = (0, react_1.useState)(false), refreshing = _h[0], setRefreshing = _h[1];
    var _j = (0, react_1.useState)(true), isFirstLoad = _j[0], setIsFirstLoad = _j[1];
    var _k = (0, react_1.useState)(null), actionSheetConv = _k[0], setActionSheetConv = _k[1];
    var currentUser = (0, auth_1.useAuthStore)(function (s) { return s.user; });
    var onlineUserIds = (0, presence_1.usePresenceStore)(function (s) { return s.onlineUserIds; });
    var setTotalUnread = (0, notifications_1.useNotificationsStore)(function (s) { return s.setTotalUnreadMessages; });
    var hiddenConversationIds = (0, conversations_1.useConversationsStore)(function (s) { return s.hiddenConversationIds; });
    var isOnline = (0, network_1.useNetworkStore)(function (s) { return s.isOnline; });
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    function loadConversations() {
        return __awaiter(this, void 0, void 0, function () {
            var cached, _a, _b, conversationsRes, contactsRes, data, nicknameMap_1, relationshipMap_1, idMap_1, muted_1, err_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, conversations_db_ts_1.getCachedConversations)()];
                    case 1:
                        cached = _c.sent();
                        if (cached.length > 0) {
                            setConversations(cached);
                            if (isFirstLoad)
                                setIsFirstLoad(false);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _c.sent();
                        return [3 /*break*/, 3];
                    case 3:
                        if (!isOnline) {
                            if (isFirstLoad)
                                setIsFirstLoad(false);
                            return [2 /*return*/];
                        }
                        _c.label = 4;
                    case 4:
                        _c.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, Promise.all([
                                api_1.api.get('/chat/conversations'),
                                api_1.api.get('/contacts'),
                            ])];
                    case 5:
                        _b = _c.sent(), conversationsRes = _b[0], contactsRes = _b[1];
                        data = conversationsRes.data;
                        setConversations(data);
                        setTotalUnread(data.reduce(function (sum, c) { return sum + c.unreadCount; }, 0));
                        void (0, conversations_db_ts_1.syncConversations)(data);
                        nicknameMap_1 = {};
                        relationshipMap_1 = {};
                        idMap_1 = {};
                        muted_1 = {};
                        contactsRes.data.forEach(function (contact) {
                            nicknameMap_1[contact.user.id] = contact.nickname || contact.user.displayName;
                            relationshipMap_1[contact.user.id] = contact.relationshipType;
                            idMap_1[contact.user.id] = contact.contactId;
                            muted_1[contact.user.id] = contact.isMuted;
                        });
                        setContactNicknameMap(nicknameMap_1);
                        setContactRelationshipMap(relationshipMap_1);
                        setContactIdMap(idMap_1);
                        setMutedMap(muted_1);
                        if (isFirstLoad)
                            setIsFirstLoad(false);
                        return [3 /*break*/, 7];
                    case 6:
                        err_1 = _c.sent();
                        console.error('Failed to load conversations:', err_1);
                        if (isFirstLoad)
                            setIsFirstLoad(false);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    (0, native_1.useFocusEffect)((0, react_1.useCallback)(function () {
        loadConversations();
        var socket = (0, socket_1.getSocket)();
        if (!socket)
            return;
        function onNewMessage() {
            loadConversations();
        }
        function onMessageStatus(data) {
            setConversations(function (prev) {
                return prev.map(function (conv) {
                    return conv.id === data.conversationId && conv.lastMessage
                        ? __assign(__assign({}, conv), { lastMessage: __assign(__assign({}, conv.lastMessage), { status: data.status }) }) : conv;
                });
            });
        }
        function onConversationDeleted(data) {
            conversations_1.useConversationsStore.getState().addHiddenConversation(data.conversationId);
            void (0, conversations_db_ts_1.hideCachedConversation)(data.conversationId);
        }
        function onConnect() {
            loadConversations();
        }
        socket.on('message:new', onNewMessage);
        socket.on('messages:status', onMessageStatus);
        socket.on('conversation:deleted', onConversationDeleted);
        socket.on('connect', onConnect);
        return function () {
            socket.off('message:new', onNewMessage);
            socket.off('messages:status', onMessageStatus);
            socket.off('conversation:deleted', onConversationDeleted);
            socket.off('connect', onConnect);
        };
    }, [isOnline]));
    function onRefresh() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setRefreshing(true);
                        return [4 /*yield*/, loadConversations()];
                    case 1:
                        _a.sent();
                        setRefreshing(false);
                        return [2 /*return*/];
                }
            });
        });
    }
    function renderConversation(_a) {
        var _b, _c;
        var item = _a.item;
        var otherUser = item.otherUser;
        var displayName = contactNicknameMap[otherUser.id] || otherUser.displayName;
        var relationshipType = contactRelationshipMap[otherUser.id] || 'friend';
        return (<react_native_1.TouchableOpacity style={styles.conversationRow} activeOpacity={0.6} onPress={function () {
                return navigation.navigate('Chat', {
                    conversationId: item.id,
                    otherUser: otherUser,
                    relationshipType: relationshipType,
                    contactId: contactIdMap[otherUser.id],
                    nickname: contactNicknameMap[otherUser.id] || undefined,
                });
            }} onLongPress={function () { return setActionSheetConv(item); }}>
                <Avatar_1.Avatar uri={otherUser.avatarUrl} name={displayName} color={otherUser.avatarColor} size={56} isOnline={onlineUserIds.has(otherUser.id)}/>
                <react_native_1.View style={styles.conversationInfo}>
                    <react_native_1.View style={styles.conversationTop}>
                        <react_native_1.Text style={styles.conversationName} numberOfLines={1}>
                            {displayName}
                        </react_native_1.Text>
                        {item.lastMessage && (<react_native_1.Text style={styles.conversationTime}>
                                {formatTime(item.lastMessage.createdAt)}
                            </react_native_1.Text>)}
                    </react_native_1.View>
                    <react_native_1.View style={styles.conversationBottom}>
                        <react_native_1.Text style={styles.conversationPreview} numberOfLines={1}>
                            {getLastMessagePreview(item)}
                        </react_native_1.Text>
                        {((_b = item.lastMessage) === null || _b === void 0 ? void 0 : _b.senderId) === (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) &&
                ((_c = item.lastMessage) === null || _c === void 0 ? void 0 : _c.status) === 'read' ? (<Avatar_1.Avatar uri={otherUser.avatarUrl} name={otherUser.displayName} color={otherUser.avatarColor} size={14}/>) : item.unreadCount > 0 ? (<react_native_1.View style={styles.unreadBadge}>
                                <react_native_1.Text style={styles.unreadText}>{item.unreadCount}</react_native_1.Text>
                            </react_native_1.View>) : null}
                    </react_native_1.View>
                </react_native_1.View>
            </react_native_1.TouchableOpacity>);
    }
    if (isFirstLoad && conversations.length === 0) {
        return isOnline ? (<ConversationSkeleton_1.ConversationSkeleton />) : (<react_native_1.View style={styles.container}>
                <OfflineBanner_1.OfflineBanner />
                <react_native_1.View style={styles.offlineEmpty}>
                    <react_native_1.Text style={styles.offlineEmptyText}>
                        No conversations loaded yet.{'\n'}Connect to get started.
                    </react_native_1.Text>
                </react_native_1.View>
            </react_native_1.View>);
    }
    var filteredConversations = conversations.filter(function (conv) { return !hiddenConversationIds.has(conv.id); });
    return (<react_native_1.View style={styles.container}>
            <OfflineBanner_1.OfflineBanner />
            <react_native_1.FlatList data={filteredConversations} keyExtractor={function (item) { return item.id; }} renderItem={renderConversation} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>} ListEmptyComponent={!isOnline ? (<react_native_1.View style={styles.offlineEmpty}>
                            <react_native_1.Text style={styles.offlineEmptyText}>
                                You're offline. Connect to load your conversations.
                            </react_native_1.Text>
                        </react_native_1.View>) : (<react_native_1.View style={styles.emptyContainer}>
                            <react_native_1.Text style={styles.emptyTitle}>No conversations yet</react_native_1.Text>
                            <react_native_1.Text style={styles.emptySubtitle}>Add contacts to start chatting</react_native_1.Text>
                        </react_native_1.View>)}/>
            <ConversationActionSheet_1.ConversationActionSheet visible={!!actionSheetConv} conversation={actionSheetConv} contactId={actionSheetConv ? contactIdMap[actionSheetConv.otherUser.id] : undefined} isMuted={actionSheetConv ? ((_b = mutedMap[actionSheetConv.otherUser.id]) !== null && _b !== void 0 ? _b : false) : false} onClose={function () { return setActionSheetConv(null); }}/>
        </react_native_1.View>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        conversationRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        conversationInfo: { flex: 1, marginLeft: 12 },
        conversationTop: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        conversationName: { fontSize: 16, fontWeight: '600', color: colors.dark, flex: 1 },
        conversationTime: { fontSize: 12, color: colors.gray400, marginLeft: 8 },
        conversationBottom: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
        },
        conversationPreview: { fontSize: 14, color: colors.gray400, flex: 1, marginRight: 8 },
        unreadBadge: {
            backgroundColor: colors.primary,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6,
        },
        unreadText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
        emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
        emptyTitle: { color: colors.gray400, fontSize: 16 },
        emptySubtitle: { color: colors.gray300, fontSize: 14, marginTop: 4 },
        offlineEmpty: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 80,
            paddingHorizontal: 32,
        },
        offlineEmptyText: {
            color: colors.gray400,
            fontSize: 15,
            textAlign: 'center',
            lineHeight: 22,
        },
    });
}
