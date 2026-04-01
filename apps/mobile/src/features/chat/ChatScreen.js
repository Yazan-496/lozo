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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatScreen = ChatScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var react_native_safe_area_context_1 = require("react-native-safe-area-context");
var elements_1 = require("@react-navigation/elements");
var Clipboard = __importStar(require("expo-clipboard"));
var ImagePicker = __importStar(require("expo-image-picker"));
var DocumentPicker = __importStar(require("expo-document-picker"));
var expo_audio_1 = require("expo-audio");
var vector_icons_1 = require("@expo/vector-icons");
var Avatar_1 = require("../../shared/components/Avatar");
var MessageSkeleton_1 = require("../../shared/components/MessageSkeleton");
var OfflineBanner_1 = require("../../shared/components/OfflineBanner");
var Toast_1 = require("../../shared/components/Toast");
var api_1 = require("../../shared/services/api");
var socket_1 = require("../../shared/services/socket");
var outbox_1 = require("../../shared/services/outbox");
var messages_db_ts_1 = require("../../shared/db/messages.db.ts");
var outbox_db_ts_1 = require("../../shared/db/outbox.db.ts");
var auth_1 = require("../../shared/stores/auth");
var presence_1 = require("../../shared/stores/presence");
var network_1 = require("../../shared/stores/network");
var useThemeColors_1 = require("../../shared/hooks/useThemeColors");
var media_1 = require("../../shared/utils/media");
var presence_2 = require("../../shared/utils/presence");
var MessageActionMenu_1 = require("./components/MessageActionMenu");
var ReplyPreviewBar_1 = require("./components/ReplyPreviewBar");
var ForwardModal_1 = require("./components/ForwardModal");
var EmojiPickerModal_1 = require("./components/EmojiPickerModal");
var AttachmentSheet_1 = require("./components/AttachmentSheet");
var ImagePreviewScreen_1 = require("./components/ImagePreviewScreen");
var ImageViewerModal_1 = require("./components/ImageViewerModal");
var VoiceMessageBubble_1 = require("./components/VoiceMessageBubble");
var FileBubble_1 = require("./components/FileBubble");
var TypingIndicator_1 = require("./components/TypingIndicator");
function formatMessageTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function groupReactions(reactions, currentUserId) {
    var _a;
    var map = {};
    var myEmoji = null;
    for (var _i = 0, reactions_1 = reactions; _i < reactions_1.length; _i++) {
        var r = reactions_1[_i];
        map[r.emoji] = ((_a = map[r.emoji]) !== null && _a !== void 0 ? _a : 0) + 1;
        if (r.userId === currentUserId)
            myEmoji = r.emoji;
    }
    return Object.entries(map)
        .map(function (_a) {
        var emoji = _a[0], count = _a[1];
        return ({ emoji: emoji, count: count, mine: emoji === myEmoji });
    })
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, 6);
}
function ChatScreen(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f;
    var navigation = _a.navigation, route = _a.route;
    var _g = route.params, conversationId = _g.conversationId, otherUser = _g.otherUser, user = _g.user, relationshipType = _g.relationshipType, contactId = _g.contactId, nickname = _g.nickname;
    // Support both otherUser and user params; may be undefined when opened from a notification
    var _h = (0, react_1.useState)(otherUser || user), chatUser = _h[0], setChatUser = _h[1];
    var insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    var headerHeight = (0, elements_1.useHeaderHeight)();
    var _j = (0, react_1.useState)([]), messages = _j[0], setMessages = _j[1];
    var _k = (0, react_1.useState)(''), text = _k[0], setText = _k[1];
    var _l = (0, react_1.useState)(false), isTyping = _l[0], setIsTyping = _l[1];
    var _m = (0, react_1.useState)(true), isFirstLoad = _m[0], setIsFirstLoad = _m[1];
    var _o = (0, react_1.useState)(null), selectedMessage = _o[0], setSelectedMessage = _o[1];
    var _p = (0, react_1.useState)(0), selectedMessageY = _p[0], setSelectedMessageY = _p[1];
    var _q = (0, react_1.useState)(null), replyingTo = _q[0], setReplyingTo = _q[1];
    var _r = (0, react_1.useState)(null), editingMessage = _r[0], setEditingMessage = _r[1];
    var _s = (0, react_1.useState)(false), showForwardModal = _s[0], setShowForwardModal = _s[1];
    var _t = (0, react_1.useState)(false), showActionMenu = _t[0], setShowActionMenu = _t[1];
    var _u = (0, react_1.useState)(false), showEmojiPicker = _u[0], setShowEmojiPicker = _u[1];
    // T004 — Media state
    var _v = (0, react_1.useState)(false), showAttachmentSheet = _v[0], setShowAttachmentSheet = _v[1];
    var _w = (0, react_1.useState)(null), previewImageUri = _w[0], setPreviewImageUri = _w[1];
    var _x = (0, react_1.useState)(false), isSendingMedia = _x[0], setIsSendingMedia = _x[1];
    var _y = (0, react_1.useState)(null), viewingImageUrl = _y[0], setViewingImageUrl = _y[1];
    var _z = (0, react_1.useState)(null), viewingImageMeta = _z[0], setViewingImageMeta = _z[1];
    var _0 = (0, react_1.useState)(null), expandedStatusId = _0[0], setExpandedStatusId = _0[1];
    var _1 = (0, react_1.useState)(null), detailsMessage = _1[0], setDetailsMessage = _1[1];
    var _2 = (0, react_1.useState)(false), isRecording = _2[0], setIsRecording = _2[1];
    var _3 = (0, react_1.useState)(0), recordingDuration = _3[0], setRecordingDuration = _3[1];
    var _4 = (0, react_1.useState)(null), playingMessageId = _4[0], setPlayingMessageId = _4[1];
    var _5 = (0, react_1.useState)({}), uploadProgressMap = _5[0], setUploadProgressMap = _5[1];
    var _6 = (0, react_1.useState)({}), localStatusMap = _6[0], setLocalStatusMap = _6[1];
    // T004 — Media refs
    var audioRecorder = (0, expo_audio_1.useAudioRecorder)(expo_audio_1.RecordingPresets.HIGH_QUALITY);
    var audioPlayer = (0, expo_audio_1.useAudioPlayer)(null);
    var playerStatus = (0, expo_audio_1.useAudioPlayerStatus)(audioPlayer);
    var recordingTimerRef = (0, react_1.useRef)(null);
    var recordingStartRef = (0, react_1.useRef)(0);
    var _7 = (0, react_1.useState)(false), showScrollBtn = _7[0], setShowScrollBtn = _7[1];
    var _8 = (0, react_1.useState)(false), loadingOlder = _8[0], setLoadingOlder = _8[1];
    var _9 = (0, react_1.useState)(true), hasMoreOlder = _9[0], setHasMoreOlder = _9[1];
    var flatListRef = (0, react_1.useRef)(null);
    var inputRef = (0, react_1.useRef)(null);
    var currentUser = (0, auth_1.useAuthStore)(function (s) { return s.user; });
    var isOnline = (0, network_1.useNetworkStore)(function (s) { return s.isOnline; });
    var isOtherOnline = (0, presence_1.usePresenceStore)(function (s) {
        return chatUser ? s.onlineUserIds.has(chatUser.id) : false;
    });
    var otherLastSeen = (0, presence_1.usePresenceStore)(function (s) { var _a; return chatUser ? ((_a = s.lastSeenMap[chatUser.id]) !== null && _a !== void 0 ? _a : chatUser.lastSeenAt) : null; });
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    var typingTimeout = (0, react_1.useRef)(null);
    var swipeAnimMap = (0, react_1.useRef)({});
    var pendingTimers = (0, react_1.useRef)({});
    var showToast = (0, Toast_1.useToast)().showToast;
    // Nickname overrides the display name throughout this screen
    var headerDisplayName = nickname || (chatUser === null || chatUser === void 0 ? void 0 : chatUser.displayName) || '';
    // If opened from a notification (no otherUser in params), resolve it from the conversations list
    (0, react_1.useEffect)(function () {
        if (chatUser)
            return;
        api_1.api.get('/chat/conversations')
            .then(function (_a) {
            var data = _a.data;
            var conv = data.find(function (c) { return c.id === conversationId; });
            if (conv === null || conv === void 0 ? void 0 : conv.otherUser)
                setChatUser(conv.otherUser);
        })
            .catch(function () { });
    }, [conversationId]);
    (0, react_1.useEffect)(function () {
        if (!chatUser)
            return;
        var relationshipEmoji = relationshipType === 'lover' ? '❤️' : '💙';
        function resolveContactId() {
            return __awaiter(this, void 0, void 0, function () {
                var data, found, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (contactId)
                                return [2 /*return*/, contactId];
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../../shared/services/api')); })];
                        case 2: return [4 /*yield*/, (_b.sent()).contactsApi.getContacts()];
                        case 3:
                            data = (_b.sent()).data;
                            found = data.find(function (c) { return c.user.id === chatUser.id; });
                            return [2 /*return*/, found === null || found === void 0 ? void 0 : found.contactId];
                        case 4:
                            _a = _b.sent();
                            return [2 /*return*/, undefined];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        navigation.setOptions({
            headerTitle: function () { return (<react_native_1.TouchableOpacity style={styles.headerRow} activeOpacity={0.7} onPress={function () { return __awaiter(_this, void 0, void 0, function () {
                    var resolvedContactId;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, resolveContactId()];
                            case 1:
                                resolvedContactId = _a.sent();
                                if (!resolvedContactId)
                                    return [2 /*return*/];
                                navigation.navigate('ContactProfile', {
                                    contactId: resolvedContactId,
                                    otherUser: chatUser,
                                    conversationId: conversationId,
                                    relationshipType: relationshipType,
                                });
                                return [2 /*return*/];
                        }
                    });
                }); }}>
                    <Avatar_1.Avatar uri={chatUser.avatarUrl} name={headerDisplayName} color={chatUser.avatarColor} size={36} isOnline={chatUser.isOnline}/>
                    <react_native_1.View style={styles.headerInfo}>
                        <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <react_native_1.Text style={styles.headerName}>{headerDisplayName}</react_native_1.Text>
                            {relationshipType && (<react_native_1.Text style={{ marginLeft: 4, fontSize: 14 }}>
                                    {relationshipEmoji}
                                </react_native_1.Text>)}
                        </react_native_1.View>
                        <react_native_1.Text style={styles.headerStatus}>
                            {isTyping
                    ? 'typing...'
                    : (0, presence_2.getPresenceString)(isOtherOnline, otherLastSeen || '')}
                        </react_native_1.Text>
                    </react_native_1.View>
                </react_native_1.TouchableOpacity>); },
        });
    }, [chatUser, isTyping, isOtherOnline, otherLastSeen, relationshipType, nickname, contactId]);
    (0, react_1.useEffect)(function () {
        if (playerStatus.didJustFinish) {
            setPlayingMessageId(null);
        }
    }, [playerStatus.didJustFinish]);
    function loadMessages() {
        return __awaiter(this, void 0, void 0, function () {
            var cached, err_1, data, _i, data_1, msg, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, messages_db_ts_1.getMessages)(conversationId, 50)];
                    case 1:
                        cached = _a.sent();
                        if (cached.length > 0) {
                            setMessages(cached.map(messages_db_ts_1.localRowToMessage));
                            if (isFirstLoad)
                                setIsFirstLoad(false);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        console.error('SQLite load failed:', err_1);
                        return [3 /*break*/, 3];
                    case 3:
                        // 2. Fetch from server when online
                        if (!isOnline) {
                            if (isFirstLoad)
                                setIsFirstLoad(false);
                            return [2 /*return*/];
                        }
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, api_1.api.get("/chat/conversations/".concat(conversationId, "/messages"))];
                    case 5:
                        data = (_a.sent()).data;
                        // Ensure server data is sorted newest-first to match local cache and inverted FlatList
                        setMessages(data.sort(function (a, b) { return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); }));
                        // Persist server messages to SQLite
                        for (_i = 0, data_1 = data; _i < data_1.length; _i++) {
                            msg = data_1[_i];
                            void (0, messages_db_ts_1.upsertServerMessage)(msg, currentUser === null || currentUser === void 0 ? void 0 : currentUser.id);
                        }
                        if (isFirstLoad)
                            setIsFirstLoad(false);
                        return [3 /*break*/, 7];
                    case 6:
                        err_2 = _a.sent();
                        console.error('Failed to load messages from server:', err_2);
                        if (isFirstLoad)
                            setIsFirstLoad(false);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    // Register outbox sync callback so UI updates when offline messages are delivered
    (0, react_1.useEffect)(function () {
        (0, outbox_1.setOnMessageSynced)(function (localId, serverId) {
            setMessages(function (prev) {
                return prev.map(function (m) {
                    return m.localId === localId || m.id === localId
                        ? __assign(__assign({}, m), { id: serverId, syncStatus: 'sent', status: null }) : m;
                });
            });
            setLocalStatusMap(function (prev) {
                var n = __assign({}, prev);
                delete n[localId];
                return n;
            });
        });
        return function () { return (0, outbox_1.setOnMessageSynced)(null); };
    }, []);
    (0, react_1.useEffect)(function () {
        loadMessages();
        api_1.api.post("/chat/conversations/".concat(conversationId, "/read")).catch(function () { });
        var socket = (0, socket_1.getSocket)();
        if (!socket || !chatUser)
            return;
        // Notify sender that their messages are read on chat open
        socket.emit('messages:read', { conversationId: conversationId, senderId: chatUser.id });
        // Load older messages when user scrolls to top (inverted FlatList triggers onEndReached)
        function onNewMessage(data) {
            if (data.conversationId === conversationId) {
                // Persist to SQLite
                void (0, messages_db_ts_1.upsertServerMessage)(data.message, currentUser === null || currentUser === void 0 ? void 0 : currentUser.id);
                setMessages(function (prev) {
                    var _a, _b;
                    return __spreadArray([
                        __assign(__assign({}, data.message), { reactions: (_a = data.message.reactions) !== null && _a !== void 0 ? _a : [], replyTo: (_b = data.message.replyTo) !== null && _b !== void 0 ? _b : null })
                    ], prev, true);
                });
                api_1.api.post("/chat/conversations/".concat(conversationId, "/read")).catch(function () { });
                socket === null || socket === void 0 ? void 0 : socket.emit('messages:read', { conversationId: conversationId, senderId: chatUser.id });
            }
        }
        function onMessageEdited(data) {
            if (data.conversationId === conversationId) {
                setMessages(function (prev) {
                    return prev.map(function (m) {
                        var _a;
                        return m.id === data.message.id
                            ? __assign(__assign(__assign({}, m), data.message), { reactions: (_a = data.message.reactions) !== null && _a !== void 0 ? _a : m.reactions }) : m;
                    });
                });
            }
        }
        function onMessageDeleted(data) {
            if (data.conversationId === conversationId) {
                setMessages(function (prev) {
                    return prev.map(function (m) {
                        return m.id === data.messageId
                            ? __assign(__assign({}, m), { deletedForEveryone: true, content: null, mediaUrl: null }) : m;
                    });
                });
            }
        }
        function onReaction(data) {
            if (data.conversationId === conversationId) {
                setMessages(function (prev) {
                    return prev.map(function (m) {
                        if (m.id !== data.messageId)
                            return m;
                        var reactions = __spreadArray([], m.reactions, true);
                        if (data.action === 'removed') {
                            reactions = reactions.filter(function (r) { return r.userId !== data.userId; });
                        }
                        else {
                            var idx = reactions.findIndex(function (r) { return r.userId === data.userId; });
                            if (idx >= 0)
                                reactions[idx] = { emoji: data.emoji, userId: data.userId };
                            else
                                reactions.push({ emoji: data.emoji, userId: data.userId });
                        }
                        return __assign(__assign({}, m), { reactions: reactions });
                    });
                });
            }
        }
        function onTypingStart(data) {
            if (data.conversationId === conversationId && data.userId === chatUser.id)
                setIsTyping(true);
        }
        function onTypingStop(data) {
            if (data.conversationId === conversationId && data.userId === chatUser.id)
                setIsTyping(false);
        }
        function onMessageStatus(data) {
            if (data.conversationId === conversationId) {
                setMessages(function (prev) {
                    return prev.map(function (m) {
                        return m.senderId === (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) ? __assign(__assign({}, m), { status: data.status }) : m;
                    });
                });
            }
        }
        function onConversationDeleted(data) {
            if (data.conversationId === conversationId) {
                navigation.goBack();
            }
        }
        socket.on('message:new', onNewMessage);
        socket.on('message:edited', onMessageEdited);
        socket.on('message:deleted', onMessageDeleted);
        socket.on('message:reaction', onReaction);
        socket.on('typing:start', onTypingStart);
        socket.on('typing:stop', onTypingStop);
        socket.on('messages:status', onMessageStatus);
        socket.on('conversation:deleted', onConversationDeleted);
        return function () {
            socket.off('message:new', onNewMessage);
            socket.off('message:edited', onMessageEdited);
            socket.off('message:deleted', onMessageDeleted);
            socket.off('message:reaction', onReaction);
            socket.off('typing:start', onTypingStart);
            socket.off('typing:stop', onTypingStop);
            socket.off('messages:status', onMessageStatus);
            socket.off('conversation:deleted', onConversationDeleted);
        };
    }, [conversationId, chatUser === null || chatUser === void 0 ? void 0 : chatUser.id]);
    function loadOlderMessages() {
        return __awaiter(this, void 0, void 0, function () {
            var oldest, rows, mapped, existingIds_1, newOnes_1, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (loadingOlder || !hasMoreOlder)
                            return [2 /*return*/];
                        if (messages.length === 0)
                            return [2 /*return*/];
                        oldest = messages[messages.length - 1].createdAt;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        setLoadingOlder(true);
                        return [4 /*yield*/, (0, messages_db_ts_1.getMessages)(conversationId, 50, oldest)];
                    case 2:
                        rows = _a.sent();
                        mapped = rows.map(messages_db_ts_1.localRowToMessage);
                        if (mapped.length === 0) {
                            setHasMoreOlder(false);
                            return [2 /*return*/];
                        }
                        existingIds_1 = new Set(messages.map(function (m) { return m.id; }));
                        newOnes_1 = mapped.filter(function (m) { return !existingIds_1.has(m.id); });
                        if (newOnes_1.length > 0) {
                            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), newOnes_1, true); });
                        }
                        else {
                            setHasMoreOlder(false);
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        err_3 = _a.sent();
                        console.error('Failed to load older messages:', err_3);
                        return [3 /*break*/, 5];
                    case 4:
                        setLoadingOlder(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleTyping() {
        var socket = (0, socket_1.getSocket)();
        if (!socket)
            return;
        socket.emit('typing:start', { conversationId: conversationId, recipientId: chatUser.id });
        if (typingTimeout.current)
            clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(function () {
            socket.emit('typing:stop', { conversationId: conversationId, recipientId: chatUser.id });
        }, 2000);
    }
    // T005 — Upload helper (fetch handles RN FormData file objects more reliably than axios)
    function uploadMedia(uri, mimeType, fileName) {
        return __awaiter(this, void 0, void 0, function () {
            var formData, token, response, text_1, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        formData = new FormData();
                        formData.append('file', { uri: uri, name: fileName, type: mimeType });
                        token = auth_1.useAuthStore.getState().accessToken;
                        return [4 /*yield*/, fetch("".concat(api_1.BASE_URL, "/api/upload/chat"), {
                                method: 'POST',
                                headers: { Authorization: "Bearer ".concat(token) },
                                body: formData,
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        text_1 = _a.sent();
                        throw new Error("Upload failed ".concat(response.status, ": ").concat(text_1));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        data = _a.sent();
                        return [2 /*return*/, data.url];
                }
            });
        });
    }
    // T008 — Pick image
    function handlePickImage(source) {
        return __awaiter(this, void 0, void 0, function () {
            var granted, result, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setShowAttachmentSheet(false);
                        if (!(source === 'gallery')) return [3 /*break*/, 2];
                        return [4 /*yield*/, ImagePicker.requestMediaLibraryPermissionsAsync()];
                    case 1:
                        granted = (_b.sent()).granted;
                        if (!granted) {
                            showToast('error', 'Go to Settings > LoZo to allow photo access');
                            return [2 /*return*/];
                        }
                        _b.label = 2;
                    case 2:
                        if (!(source === 'gallery')) return [3 /*break*/, 4];
                        return [4 /*yield*/, ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ['images'],
                                quality: 0.85,
                            })];
                    case 3:
                        _a = _b.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, ImagePicker.launchCameraAsync({ quality: 0.85 })];
                    case 5:
                        _a = _b.sent();
                        _b.label = 6;
                    case 6:
                        result = _a;
                        if (!result.canceled && result.assets[0]) {
                            setPreviewImageUri(result.assets[0].uri);
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    // T010 — Send image
    function handleSendImage() {
        return __awaiter(this, void 0, void 0, function () {
            var tempId, capturedUri, tempMsg, url, data_2, err_4;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!previewImageUri)
                            return [2 /*return*/];
                        setIsSendingMedia(true);
                        tempId = "temp_".concat(Date.now());
                        capturedUri = previewImageUri;
                        tempMsg = {
                            id: tempId,
                            conversationId: conversationId,
                            senderId: currentUser.id,
                            type: 'image',
                            content: null,
                            mediaUrl: capturedUri,
                            mediaName: null,
                            mediaSize: null,
                            mediaDuration: null,
                            replyToId: null,
                            forwardedFromId: null,
                            isForwarded: false,
                            editedAt: null,
                            deletedForEveryone: false,
                            createdAt: new Date().toISOString(),
                            reactions: [],
                            replyTo: null,
                            status: 'sent',
                        };
                        setMessages(function (prev) { return __spreadArray([tempMsg], prev, true); });
                        setPreviewImageUri(null);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, uploadMedia(capturedUri, 'image/jpeg', "image_".concat(Date.now(), ".jpg"))];
                    case 2:
                        url = _d.sent();
                        return [4 /*yield*/, api_1.api.post("/chat/conversations/".concat(conversationId, "/messages"), {
                                type: 'image',
                                mediaUrl: url,
                            })];
                    case 3:
                        data_2 = (_d.sent()).data;
                        setMessages(function (prev) {
                            return prev.map(function (m) { var _a; return m.id === tempId ? __assign(__assign({}, data_2), { reactions: (_a = data_2.reactions) !== null && _a !== void 0 ? _a : [] }) : m; });
                        });
                        setUploadProgressMap(function (prev) {
                            var n = __assign({}, prev);
                            delete n[tempId];
                            return n;
                        });
                        return [3 /*break*/, 6];
                    case 4:
                        err_4 = _d.sent();
                        console.error('Upload image error:', (_a = err_4 === null || err_4 === void 0 ? void 0 : err_4.response) === null || _a === void 0 ? void 0 : _a.status, (_c = (_b = err_4 === null || err_4 === void 0 ? void 0 : err_4.response) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : err_4 === null || err_4 === void 0 ? void 0 : err_4.message);
                        showToast('error', 'Failed to send image');
                        setMessages(function (prev) { return prev.filter(function (m) { return m.id !== tempId; }); });
                        return [3 /*break*/, 6];
                    case 5:
                        setIsSendingMedia(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    // T013 — Voice recording
    function startRecording() {
        return __awaiter(this, void 0, void 0, function () {
            var granted, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, expo_audio_1.AudioModule.requestRecordingPermissionsAsync()];
                    case 1:
                        granted = (_b.sent()).granted;
                        if (!granted) {
                            showToast('error', 'Go to Settings > LoZo to allow microphone access');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, expo_audio_1.AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, audioRecorder.prepareToRecordAsync(expo_audio_1.RecordingPresets.HIGH_QUALITY)];
                    case 3:
                        _b.sent();
                        audioRecorder.record();
                        recordingStartRef.current = Date.now();
                        setIsRecording(true);
                        setRecordingDuration(0);
                        recordingTimerRef.current = setInterval(function () { return setRecordingDuration(function (d) { return d + 100; }); }, 100);
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        showToast('error', 'Could not start recording');
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function stopAndSendRecording() {
        return __awaiter(this, void 0, void 0, function () {
            var uri, durationMs, durationSecs, tempId, tempMsg, url, data_3, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (recordingTimerRef.current)
                            clearInterval(recordingTimerRef.current);
                        setIsRecording(false);
                        return [4 /*yield*/, audioRecorder.stop()];
                    case 1:
                        _b.sent();
                        uri = audioRecorder.uri;
                        durationMs = Date.now() - recordingStartRef.current;
                        if (durationMs < 1000 || !uri)
                            return [2 /*return*/];
                        durationSecs = Math.round(durationMs / 1000);
                        tempId = "temp_".concat(Date.now());
                        tempMsg = {
                            id: tempId,
                            conversationId: conversationId,
                            senderId: currentUser.id,
                            type: 'voice',
                            content: null,
                            mediaUrl: uri,
                            mediaName: null,
                            mediaSize: null,
                            mediaDuration: durationSecs,
                            replyToId: null,
                            forwardedFromId: null,
                            isForwarded: false,
                            editedAt: null,
                            deletedForEveryone: false,
                            createdAt: new Date().toISOString(),
                            reactions: [],
                            replyTo: null,
                            status: 'sent',
                        };
                        setMessages(function (prev) { return __spreadArray([tempMsg], prev, true); });
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, uploadMedia(uri, 'audio/m4a', "voice_".concat(Date.now(), ".m4a"))];
                    case 3:
                        url = _b.sent();
                        return [4 /*yield*/, api_1.api.post("/chat/conversations/".concat(conversationId, "/messages"), {
                                type: 'voice',
                                mediaUrl: url,
                                mediaDuration: durationSecs,
                            })];
                    case 4:
                        data_3 = (_b.sent()).data;
                        setMessages(function (prev) {
                            return prev.map(function (m) { var _a; return m.id === tempId ? __assign(__assign({}, data_3), { reactions: (_a = data_3.reactions) !== null && _a !== void 0 ? _a : [] }) : m; });
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        _a = _b.sent();
                        showToast('error', 'Failed to send voice message');
                        setMessages(function (prev) { return prev.filter(function (m) { return m.id !== tempId; }); });
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function cancelRecording() {
        if (recordingTimerRef.current)
            clearInterval(recordingTimerRef.current);
        audioRecorder.stop().catch(function () { });
        setIsRecording(false);
        setRecordingDuration(0);
    }
    // T016 — Voice playback
    function handlePlayVoice(messageId, audioUrl) {
        if (playingMessageId === messageId) {
            audioPlayer.pause();
            setPlayingMessageId(null);
            return;
        }
        try {
            audioPlayer.replace({ uri: audioUrl });
            audioPlayer.play();
            setPlayingMessageId(messageId);
        }
        catch (_a) {
            showToast('error', 'Could not play voice message');
        }
    }
    // T018 — Pick and send file
    function handlePickFile() {
        return __awaiter(this, void 0, void 0, function () {
            var result, asset, tempId, tempMsg, url, data_4, _a;
            var _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        setShowAttachmentSheet(false);
                        return [4 /*yield*/, DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })];
                    case 1:
                        result = _e.sent();
                        if (result.canceled || !result.assets[0])
                            return [2 /*return*/];
                        asset = result.assets[0];
                        if (asset.size && asset.size > 50 * 1024 * 1024) {
                            showToast('error', 'File too large (max 50 MB)');
                            return [2 /*return*/];
                        }
                        tempId = "temp_".concat(Date.now());
                        tempMsg = {
                            id: tempId,
                            conversationId: conversationId,
                            senderId: currentUser.id,
                            type: 'file',
                            content: null,
                            mediaUrl: null,
                            mediaName: asset.name,
                            mediaSize: (_b = asset.size) !== null && _b !== void 0 ? _b : 0,
                            mediaDuration: null,
                            replyToId: null,
                            forwardedFromId: null,
                            isForwarded: false,
                            editedAt: null,
                            deletedForEveryone: false,
                            createdAt: new Date().toISOString(),
                            reactions: [],
                            replyTo: null,
                            status: 'sent',
                        };
                        setMessages(function (prev) { return __spreadArray([tempMsg], prev, true); });
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, uploadMedia(asset.uri, (_c = asset.mimeType) !== null && _c !== void 0 ? _c : 'application/octet-stream', asset.name)];
                    case 3:
                        url = _e.sent();
                        return [4 /*yield*/, api_1.api.post("/chat/conversations/".concat(conversationId, "/messages"), {
                                type: 'file',
                                mediaUrl: url,
                                mediaName: asset.name,
                                mediaSize: (_d = asset.size) !== null && _d !== void 0 ? _d : 0,
                            })];
                    case 4:
                        data_4 = (_e.sent()).data;
                        setMessages(function (prev) {
                            return prev.map(function (m) { var _a; return m.id === tempId ? __assign(__assign({}, data_4), { reactions: (_a = data_4.reactions) !== null && _a !== void 0 ? _a : [] }) : m; });
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        _a = _e.sent();
                        showToast('error', 'Failed to send file');
                        setMessages(function (prev) { return prev.filter(function (m) { return m.id !== tempId; }); });
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function handleEditStart() {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                setEditingMessage(selectedMessage);
                setText((_a = selectedMessage === null || selectedMessage === void 0 ? void 0 : selectedMessage.content) !== null && _a !== void 0 ? _a : '');
                setShowActionMenu(false);
                setSelectedMessage(null);
                setReplyingTo(null);
                return [2 /*return*/];
            });
        });
    }
    function handleEditSave() {
        return __awaiter(this, void 0, void 0, function () {
            var err_5;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!editingMessage || !text.trim())
                            return [2 /*return*/];
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, api_1.api.put("/chat/messages/".concat(editingMessage.id), { content: text.trim() })];
                    case 2:
                        _d.sent();
                        setMessages(function (prev) {
                            return prev.map(function (m) {
                                return m.id === editingMessage.id
                                    ? __assign(__assign({}, m), { content: text.trim(), editedAt: new Date().toISOString() }) : m;
                            });
                        });
                        setEditingMessage(null);
                        setText('');
                        return [3 /*break*/, 4];
                    case 3:
                        err_5 = _d.sent();
                        showToast('error', (_c = (_b = (_a = err_5.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) !== null && _c !== void 0 ? _c : 'Failed to edit message');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function handleDeleteForMe() {
        setMessages(function (prev) { return prev.filter(function (m) { return m.id !== (selectedMessage === null || selectedMessage === void 0 ? void 0 : selectedMessage.id); }); });
        setShowActionMenu(false);
        setSelectedMessage(null);
    }
    function handleDeleteForEveryone() {
        var _this = this;
        react_native_1.Alert.alert('Delete for everyone?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                    var err_6;
                    var _a, _b, _c;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                _d.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, api_1.api.delete("/chat/messages/".concat(selectedMessage.id, "/everyone"))];
                            case 1:
                                _d.sent();
                                setMessages(function (prev) {
                                    return prev.map(function (m) {
                                        return m.id === selectedMessage.id
                                            ? __assign(__assign({}, m), { deletedForEveryone: true, content: null, mediaUrl: null }) : m;
                                    });
                                });
                                return [3 /*break*/, 3];
                            case 2:
                                err_6 = _d.sent();
                                showToast('error', (_c = (_b = (_a = err_6.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) !== null && _c !== void 0 ? _c : 'Failed to delete');
                                return [3 /*break*/, 3];
                            case 3:
                                setShowActionMenu(false);
                                setSelectedMessage(null);
                                return [2 /*return*/];
                        }
                    });
                }); },
            },
        ]);
    }
    function handleCopy() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(selectedMessage === null || selectedMessage === void 0 ? void 0 : selectedMessage.content))
                            return [2 /*return*/];
                        return [4 /*yield*/, Clipboard.setStringAsync(selectedMessage.content)];
                    case 1:
                        _a.sent();
                        showToast('success', 'Copied to clipboard');
                        setShowActionMenu(false);
                        setSelectedMessage(null);
                        return [2 /*return*/];
                }
            });
        });
    }
    function handleForward(convId) {
        return __awaiter(this, void 0, void 0, function () {
            var socket;
            return __generator(this, function (_a) {
                if (!(selectedMessage === null || selectedMessage === void 0 ? void 0 : selectedMessage.content))
                    return [2 /*return*/];
                if (convId === conversationId) {
                    react_native_1.Alert.alert('Cannot forward', 'You cannot forward a message to the same conversation.');
                    return [2 /*return*/];
                }
                try {
                    socket = (0, socket_1.getSocket)();
                    socket === null || socket === void 0 ? void 0 : socket.emit('message:send', {
                        conversationId: convId,
                        type: 'text',
                        content: selectedMessage.content,
                        forwardedFromId: selectedMessage.id,
                    }, function () { });
                    showToast('success', 'Message forwarded');
                }
                catch (_b) {
                    showToast('error', 'Failed to forward message');
                }
                setShowForwardModal(false);
                setSelectedMessage(null);
                return [2 /*return*/];
            });
        });
    }
    function handleReact(emoji, messageId) {
        var socket = (0, socket_1.getSocket)();
        var message = messages.find(function (m) { return m.id === messageId; });
        if (!message)
            return;
        var myCurrentReaction = message.reactions.find(function (r) { return r.userId === currentUser.id; });
        // Optimistic update
        setMessages(function (prev) {
            return prev.map(function (m) {
                if (m.id !== messageId)
                    return m;
                var reactions = m.reactions.filter(function (r) { return r.userId !== currentUser.id; });
                if ((myCurrentReaction === null || myCurrentReaction === void 0 ? void 0 : myCurrentReaction.emoji) !== emoji)
                    reactions = __spreadArray(__spreadArray([], reactions, true), [{ emoji: emoji, userId: currentUser.id }], false);
                return __assign(__assign({}, m), { reactions: reactions });
            });
        });
        if (socket) {
            socket.emit('message:react', { messageId: messageId, emoji: emoji, recipientId: chatUser.id, conversationId: conversationId }, function (response) {
                if (!(response === null || response === void 0 ? void 0 : response.success)) {
                    // Rollback optimistic update
                    setMessages(function (prev) {
                        return prev.map(function (m) {
                            return m.id === messageId ? __assign(__assign({}, m), { reactions: message.reactions }) : m;
                        });
                    });
                    showToast('error', 'Failed to update reaction');
                }
            });
        }
    }
    function scrollToMessage(messageId) {
        if (!messageId)
            return;
        var target = messages.find(function (m) { return m.id === messageId; });
        if (!target || !flatListRef.current)
            return;
        flatListRef.current.scrollToItem({ item: target, animated: true });
    }
    function startPendingTimers(tempId) {
        var t1 = setTimeout(function () {
            setLocalStatusMap(function (prev) {
                var _a;
                return prev[tempId] === 'pending' ? __assign(__assign({}, prev), (_a = {}, _a[tempId] = 'sending', _a)) : prev;
            });
        }, 2000);
        var t2 = setTimeout(function () {
            setLocalStatusMap(function (prev) {
                var _a;
                return (prev[tempId] ? __assign(__assign({}, prev), (_a = {}, _a[tempId] = 'failed', _a)) : prev);
            });
        }, 20000);
        pendingTimers.current[tempId] = [t1, t2];
    }
    function clearPendingTimers(tempId) {
        var _a;
        (_a = pendingTimers.current[tempId]) === null || _a === void 0 ? void 0 : _a.forEach(clearTimeout);
        delete pendingTimers.current[tempId];
    }
    function emitTextMessage(tempId, content, replyToId, capturedReplyTo) {
        var socket = (0, socket_1.getSocket)();
        if (!(socket === null || socket === void 0 ? void 0 : socket.connected)) {
            // Offline — message stays in outbox with pending status
            clearPendingTimers(tempId);
            return;
        }
        socket.emit('message:send', { conversationId: conversationId, type: 'text', content: content, replyToId: replyToId, localId: tempId }, function (response) {
            var _a, _b;
            clearPendingTimers(tempId);
            if (response === null || response === void 0 ? void 0 : response.success) {
                void updateSentMessage(tempId, (_a = response.message) === null || _a === void 0 ? void 0 : _a.id, (_b = response.message) === null || _b === void 0 ? void 0 : _b.createdAt);
                setLocalStatusMap(function (prev) {
                    var n = __assign({}, prev);
                    delete n[tempId];
                    return n;
                });
                setMessages(function (prev) {
                    return prev.map(function (m) {
                        return m.id === tempId
                            ? __assign(__assign({}, response.message), { reactions: [], replyTo: capturedReplyTo
                                    ? {
                                        id: capturedReplyTo.id,
                                        senderId: capturedReplyTo.senderId,
                                        type: capturedReplyTo.type,
                                        content: capturedReplyTo.content,
                                        deletedForEveryone: capturedReplyTo.deletedForEveryone,
                                    }
                                    : null, status: 'sent' }) : m;
                    });
                });
            }
            else {
                setLocalStatusMap(function (prev) {
                    var _a;
                    return (__assign(__assign({}, prev), (_a = {}, _a[tempId] = 'failed', _a)));
                });
            }
        });
        socket.emit('typing:stop', { conversationId: conversationId, recipientId: chatUser.id });
    }
    // After socket ack, update SQLite with server ID
    function updateSentMessage(localId, serverId, serverCreatedAt) {
        return __awaiter(this, void 0, void 0, function () {
            var err_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!serverId)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, messages_db_ts_1.updateMessageStatus)(localId, {
                                server_id: serverId,
                                sync_status: 'sent',
                                server_created_at: serverCreatedAt,
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_7 = _a.sent();
                        console.error('Failed to update sent message in SQLite:', err_7);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function handleSend() {
        var _a, _b, _c, _d, _e;
        if (editingMessage) {
            void handleEditSave();
            return;
        }
        if (!text.trim())
            return;
        var localId = "local_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 9));
        var content = text.trim();
        var capturedReply = replyingTo;
        var now = new Date().toISOString();
        var tempMsg = {
            id: localId,
            localId: localId,
            syncStatus: 'pending',
            conversationId: conversationId,
            senderId: currentUser.id,
            type: 'text',
            content: content,
            mediaUrl: null,
            mediaName: null,
            mediaSize: null,
            mediaDuration: null,
            replyToId: (_a = capturedReply === null || capturedReply === void 0 ? void 0 : capturedReply.id) !== null && _a !== void 0 ? _a : null,
            replyTo: capturedReply
                ? {
                    id: capturedReply.id,
                    senderId: capturedReply.senderId,
                    type: capturedReply.type,
                    content: capturedReply.content,
                    deletedForEveryone: capturedReply.deletedForEveryone,
                }
                : null,
            forwardedFromId: null,
            isForwarded: false,
            editedAt: null,
            deletedForEveryone: false,
            createdAt: now,
            reactions: [],
            status: null,
        };
        setMessages(function (prev) { return __spreadArray([tempMsg], prev, true); });
        setText('');
        setReplyingTo(null);
        (_b = flatListRef.current) === null || _b === void 0 ? void 0 : _b.scrollToOffset({ offset: 0, animated: true });
        setLocalStatusMap(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[localId] = 'pending', _a)));
        });
        startPendingTimers(localId);
        // Write to SQLite and enqueue outbox
        var row = {
            local_id: localId,
            server_id: null,
            conversation_id: conversationId,
            sender_id: currentUser.id,
            type: 'text',
            content: content,
            media_url: null,
            media_name: null,
            media_size: null,
            media_duration: null,
            reply_to_id: (_c = capturedReply === null || capturedReply === void 0 ? void 0 : capturedReply.id) !== null && _c !== void 0 ? _c : null,
            is_forwarded: 0,
            forwarded_from_id: null,
            edited_at: null,
            deleted_for_everyone: 0,
            sync_status: 'pending',
            created_at: now,
            server_created_at: null,
        };
        void (0, messages_db_ts_1.insertMessage)(row);
        void (0, outbox_db_ts_1.enqueueOutbox)(localId, conversationId, {
            conversationId: conversationId,
            type: 'text',
            content: content,
            localId: localId,
            replyToId: (_d = capturedReply === null || capturedReply === void 0 ? void 0 : capturedReply.id) !== null && _d !== void 0 ? _d : null,
        });
        // Send immediately if online; outbox flush handles offline case on reconnect
        emitTextMessage(localId, content, (_e = capturedReply === null || capturedReply === void 0 ? void 0 : capturedReply.id) !== null && _e !== void 0 ? _e : null, capturedReply);
    }
    function retrySend(message) {
        var _a, _b;
        if (!message.content)
            return;
        var localId = (_a = message.localId) !== null && _a !== void 0 ? _a : message.id;
        setLocalStatusMap(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[localId] = 'pending', _a)));
        });
        startPendingTimers(localId);
        // If has localId it was queued through outbox — use outbox retry
        if (message.localId) {
            void (0, outbox_1.retry)(message.localId);
        }
        else {
            emitTextMessage(localId, message.content, (_b = message.replyToId) !== null && _b !== void 0 ? _b : null, null);
        }
    }
    function handleDiscard(message) {
        var _a;
        var localId = (_a = message.localId) !== null && _a !== void 0 ? _a : message.id;
        void (0, outbox_1.discard)(localId);
        void (0, messages_db_ts_1.deleteMessage)(localId);
        setMessages(function (prev) { return prev.filter(function (m) { return m.id !== message.id && m.localId !== localId; }); });
        setLocalStatusMap(function (prev) {
            var n = __assign({}, prev);
            delete n[localId];
            return n;
        });
    }
    // Messenger-style status icon: sent=gray circle, delivered=blue circle, read=avatar
    function MsgStatusIcon(_a) {
        var _b;
        var status = _a.status, _c = _a.size, size = _c === void 0 ? 14 : _c;
        if (status === 'read') {
            return (<react_native_1.View style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    overflow: 'hidden',
                }}>
                    <Avatar_1.Avatar uri={chatUser.avatarUrl} name={chatUser.displayName} color={(_b = chatUser.avatarColor) !== null && _b !== void 0 ? _b : colors.primary} size={size}/>
                </react_native_1.View>);
        }
        var isDelivered = status === 'delivered';
        return (<react_native_1.View style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: isDelivered ? colors.primary : colors.gray400,
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <react_native_1.Text style={{
                color: '#fff',
                fontSize: size * 0.55,
                fontWeight: '700',
                lineHeight: size,
            }}>
                    ✓
                </react_native_1.Text>
            </react_native_1.View>);
    }
    function isSameSection(a, b) {
        if (a.senderId !== b.senderId)
            return false;
        var ta = new Date(a.createdAt);
        var tb = new Date(b.createdAt);
        return (ta.getFullYear() === tb.getFullYear() &&
            ta.getMonth() === tb.getMonth() &&
            ta.getDate() === tb.getDate() &&
            ta.getHours() === tb.getHours() &&
            ta.getMinutes() === tb.getMinutes());
    }
    function renderMessage(_a) {
        var _b, _c, _d, _e, _f, _g, _h, _j, _k;
        var item = _a.item, index = _a.index;
        var isMe = item.senderId === (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id);
        // In inverted FlatList: index 0 = newest (bottom), index+1 = older (above)
        var prevMsg = messages[index - 1]; // newer = shown below
        var nextMsg = messages[index + 1]; // older = shown above
        var isBottomOfSection = !prevMsg || !isSameSection(item, prevMsg); // show avatar here
        var isTopOfSection = !nextMsg || !isSameSection(item, nextMsg);
        var localStatus = localStatusMap[item.id];
        if (item.deletedForEveryone) {
            return (<react_native_1.View style={[
                    styles.messageRow,
                    isMe ? styles.messageRowEnd : styles.messageRowStart,
                ]}>
                    <react_native_1.View style={styles.deletedBubble}>
                        <react_native_1.Text style={styles.deletedText}>Message deleted</react_native_1.Text>
                    </react_native_1.View>
                </react_native_1.View>);
        }
        var swipeAnim = (_b = swipeAnimMap.current[item.id]) !== null && _b !== void 0 ? _b : (swipeAnimMap.current[item.id] = new react_native_1.Animated.Value(0));
        var swipePan = react_native_1.PanResponder.create({
            onMoveShouldSetPanResponder: function (_, _a) {
                var dx = _a.dx, dy = _a.dy;
                return Math.abs(dx) > Math.abs(dy) && dx > 5;
            },
            onPanResponderMove: function (_, _a) {
                var dx = _a.dx, dy = _a.dy;
                if (dx > 0 && Math.abs(dy) < Math.abs(dx))
                    swipeAnim.setValue(Math.min(dx, 60));
            },
            onPanResponderRelease: function (_, _a) {
                var dx = _a.dx, vx = _a.vx;
                if (dx > 40 || vx > 0.5) {
                    setReplyingTo(item);
                    setTimeout(function () { var _a; return (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 50);
                }
                react_native_1.Animated.spring(swipeAnim, { toValue: 0, useNativeDriver: true }).start();
            },
        });
        // Last sent message by me → always show status below
        var lastSentByMe = messages.find(function (m) { return m.senderId === (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) && !m.deletedForEveryone; });
        var isLastSentByMe = isMe && (lastSentByMe === null || lastSentByMe === void 0 ? void 0 : lastSentByMe.id) === item.id;
        var isExpanded = expandedStatusId === item.id;
        var showStatusRow = isMe && item.status && (isLastSentByMe || isExpanded);
        var isImageMsg = item.type === 'image' && !!item.mediaUrl;
        // Bubble corner style — clip inner corners for grouped messages (Messenger-style)
        var bubbleRadius = __assign({ borderRadius: 18 }, (isMe
            ? {
                borderTopRightRadius: isTopOfSection ? 4 : 18,
                borderBottomRightRadius: isBottomOfSection ? 4 : 18,
            }
            : {
                borderTopLeftRadius: isTopOfSection ? 4 : 18,
                borderBottomLeftRadius: isBottomOfSection ? 4 : 18,
            }));
        return (<react_native_1.View style={[
                styles.messageRow,
                isMe ? styles.messageRowEnd : styles.messageRowStart,
                isBottomOfSection ? styles.sectionBottom : styles.sectionMiddle,
            ]}>
                {/* Avatar column for other user */}
                {!isMe &&
                (isBottomOfSection ? (<react_native_1.View style={styles.avatarCol}>
                            <Avatar_1.Avatar uri={chatUser.avatarUrl} name={chatUser.displayName} color={(_c = chatUser.avatarColor) !== null && _c !== void 0 ? _c : colors.primary} size={28}/>
                        </react_native_1.View>) : (<react_native_1.View style={styles.avatarCol}/>))}

                <react_native_1.Animated.View style={{
                flex: 1,
                alignItems: isMe ? 'flex-end' : 'flex-start',
                transform: [{ translateX: swipeAnim }],
            }} {...swipePan.panHandlers}>
                    <react_native_1.TouchableOpacity activeOpacity={isImageMsg ? 0.95 : 0.85} delayLongPress={400} onPress={function () {
                var _a, _b, _c;
                if (localStatus === 'failed') {
                    react_native_1.Alert.alert('Message not sent', 'This message could not be delivered.', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Discard',
                            style: 'destructive',
                            onPress: function () { return handleDiscard(item); },
                        },
                        { text: 'Retry', onPress: function () { return retrySend(item); } },
                    ]);
                    return;
                }
                if (isImageMsg) {
                    setViewingImageUrl(item.mediaUrl);
                    setViewingImageMeta({
                        name: isMe ? 'You' : chatUser.displayName,
                        avatarUrl: isMe
                            ? ((_a = currentUser === null || currentUser === void 0 ? void 0 : currentUser.avatarUrl) !== null && _a !== void 0 ? _a : null)
                            : chatUser.avatarUrl,
                        color: isMe
                            ? ((_b = currentUser.avatarColor) !== null && _b !== void 0 ? _b : colors.primary)
                            : ((_c = chatUser.avatarColor) !== null && _c !== void 0 ? _c : colors.primary),
                        sentAt: item.createdAt,
                        isMe: isMe,
                    });
                    return;
                }
                setExpandedStatusId(function (prev) { return (prev === item.id ? null : item.id); });
            }} onLongPress={function (event) {
                if (item.deletedForEveryone)
                    return;
                setSelectedMessageY(event.nativeEvent.pageY);
                setSelectedMessage(item);
                setShowActionMenu(true);
            }} style={{ alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                        {item.isForwarded && <react_native_1.Text style={styles.forwardedLabel}>Forwarded</react_native_1.Text>}
                        {item.replyTo && !item.deletedForEveryone && (<react_native_1.TouchableOpacity onPress={function () { return scrollToMessage(item.replyToId); }}>
                                <react_native_1.View style={[
                    styles.replyBubble,
                    isMe ? styles.replyBubbleMe : styles.replyBubbleOther,
                ]}>
                                    <react_native_1.Text style={styles.replyBubbleName}>
                                        {item.replyTo.senderId === (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id)
                    ? 'You'
                    : chatUser.displayName}
                                    </react_native_1.Text>
                                    <react_native_1.Text style={styles.replyBubbleContent} numberOfLines={1}>
                                        {item.replyTo.deletedForEveryone
                    ? 'Message deleted'
                    : item.replyTo.content}
                                    </react_native_1.Text>
                                </react_native_1.View>
                            </react_native_1.TouchableOpacity>)}

                        {/* IMAGE: no bubble container */}
                        {isImageMsg ? (<react_native_1.View style={[styles.imageBubble, bubbleRadius]}>
                                <react_native_1.Image source={{ uri: item.mediaUrl }} style={styles.imageThumbnail} resizeMode="cover"/>
                                {uploadProgressMap[item.id] !== undefined && (<react_native_1.View style={styles.uploadOverlay}>
                                        <react_native_1.View style={[
                        styles.uploadBar,
                        { width: "".concat(uploadProgressMap[item.id], "%") },
                    ]}/>
                                    </react_native_1.View>)}
                                <react_native_1.View style={styles.imageTimeOverlay}>
                                    <react_native_1.Text style={styles.imageTimeText}>
                                        {formatMessageTime(item.createdAt)}
                                    </react_native_1.Text>
                                    {isMe && item.status === 'read' && (<react_native_1.View style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        overflow: 'hidden',
                        marginLeft: 3,
                    }}>
                                            <Avatar_1.Avatar uri={chatUser.avatarUrl} name={chatUser.displayName} color={(_d = chatUser.avatarColor) !== null && _d !== void 0 ? _d : colors.primary} size={14}/>
                                        </react_native_1.View>)}
                                </react_native_1.View>
                            </react_native_1.View>) : (
            /* TEXT / VOICE / FILE: bubble */
            <react_native_1.View style={[
                    styles.messageBubble,
                    isMe ? styles.bubbleMe : styles.bubbleOther,
                    bubbleRadius,
                    localStatus === 'failed' && styles.bubbleFailed,
                ]}>
                                {item.type === 'text' && (<react_native_1.Text style={[
                        styles.messageText,
                        isMe ? styles.textMe : styles.textOther,
                    ]}>
                                        {item.content}
                                    </react_native_1.Text>)}
                                {item.type === 'voice' && item.mediaUrl && (<VoiceMessageBubble_1.VoiceMessageBubble messageId={item.id} audioUrl={item.mediaUrl} duration={(_e = item.mediaDuration) !== null && _e !== void 0 ? _e : 0} isPlaying={playingMessageId === item.id} isMe={isMe} onPlay={function () { return handlePlayVoice(item.id, item.mediaUrl); }} onPause={function () { return handlePlayVoice(item.id, item.mediaUrl); }}/>)}
                                {item.type === 'file' && item.mediaUrl && (<FileBubble_1.FileBubble fileName={(_f = item.mediaName) !== null && _f !== void 0 ? _f : 'File'} fileSize={(_g = item.mediaSize) !== null && _g !== void 0 ? _g : 0} fileUrl={item.mediaUrl} isMe={isMe}/>)}
                                <react_native_1.View style={styles.messageFooter}>
                                    {item.editedAt && (<react_native_1.Text style={[
                        styles.metaText,
                        isMe ? styles.metaMe : styles.metaOther,
                    ]}>
                                            edited
                                        </react_native_1.Text>)}
                                    <react_native_1.Text style={[
                    styles.metaText,
                    isMe ? styles.metaMe : styles.metaOther,
                ]}>
                                        {formatMessageTime(item.createdAt)}
                                    </react_native_1.Text>
                                </react_native_1.View>
                            </react_native_1.View>)}

                        {/* Local send status (pending/sending/failed) */}
                        {localStatus === 'sending' && (<react_native_1.Text style={styles.sendingText}>Sending...</react_native_1.Text>)}
                        {localStatus === 'failed' && (<react_native_1.Text style={styles.failedText}>Unable to send · Tap to retry</react_native_1.Text>)}

                        {/* Messenger-style delivery status row */}
                        {showStatusRow && !localStatus && (<react_native_1.View style={[
                    styles.statusRow,
                    isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
                ]}>
                                {isExpanded && (<react_native_1.Text style={styles.statusDate}>
                                        {new Date(item.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                                    </react_native_1.Text>)}
                                <MsgStatusIcon status={item.status} size={14}/>
                                {(isExpanded || isLastSentByMe) && (<react_native_1.Text style={styles.statusLabel}>
                                        {item.status === 'sent'
                        ? 'Sent'
                        : item.status === 'delivered'
                            ? 'Delivered'
                            : 'Seen'}
                                    </react_native_1.Text>)}
                            </react_native_1.View>)}
                    </react_native_1.TouchableOpacity>

                    {item.reactions.length > 0 && !item.deletedForEveryone && (<react_native_1.View style={[
                    styles.reactionsRow,
                    isMe
                        ? { alignSelf: 'flex-end', marginRight: 8 }
                        : { alignSelf: 'flex-start', marginLeft: 8 },
                ]}>
                            {groupReactions(item.reactions, currentUser.id).map(function (pill) { return (<react_native_1.TouchableOpacity key={pill.emoji} style={[
                        styles.reactionPill,
                        pill.mine && styles.reactionPillMine,
                    ]} onPress={function () { return handleReact(pill.emoji, item.id); }}>
                                    <react_native_1.Text style={styles.reactionPillText}>
                                        {pill.emoji} {pill.count}
                                    </react_native_1.Text>
                                </react_native_1.TouchableOpacity>); })}
                        </react_native_1.View>)}
                </react_native_1.Animated.View>

                {/* Avatar column for me — right side */}
                {isMe &&
                (isBottomOfSection ? (<react_native_1.View style={[styles.avatarCol, { marginRight: 0, marginLeft: 4 }]}>
                            <Avatar_1.Avatar uri={(_h = currentUser === null || currentUser === void 0 ? void 0 : currentUser.avatarUrl) !== null && _h !== void 0 ? _h : null} name={(_j = currentUser === null || currentUser === void 0 ? void 0 : currentUser.displayName) !== null && _j !== void 0 ? _j : 'Me'} color={(_k = currentUser.avatarColor) !== null && _k !== void 0 ? _k : colors.primary} size={28}/>
                        </react_native_1.View>) : (<react_native_1.View style={[styles.avatarCol, { marginRight: 0, marginLeft: 4 }]}/>))}
            </react_native_1.View>);
    }
    var canSend = text.trim().length > 0;
    if (!chatUser)
        return <MessageSkeleton_1.MessageSkeleton />;
    if (isFirstLoad && messages.length === 0) {
        if (isOnline)
            return <MessageSkeleton_1.MessageSkeleton />;
        return (<react_native_1.View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <OfflineBanner_1.OfflineBanner />
                <react_native_1.Text style={[
                styles.metaText,
                {
                    color: styles.deletedText.color,
                    textAlign: 'center',
                    paddingHorizontal: 32,
                },
            ]}>
                    No messages loaded yet.{'\n'}Connect to load this conversation.
                </react_native_1.Text>
            </react_native_1.View>);
    }
    return (<react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container} keyboardVerticalOffset={react_native_1.Platform.OS === 'ios' ? headerHeight : 100}>
            <OfflineBanner_1.OfflineBanner />
            <react_native_1.FlatList ref={flatListRef} data={messages} keyExtractor={function (item) { return item.id; }} renderItem={renderMessage} inverted contentContainerStyle={styles.messagesList} keyboardShouldPersistTaps="never" ListHeaderComponent={isTyping ? <TypingIndicator_1.TypingIndicator /> : null} onScroll={function (e) {
            setShowScrollBtn(e.nativeEvent.contentOffset.y > 300);
        }} scrollEventThrottle={100} onEndReached={function () {
            void loadOlderMessages();
        }} onEndReachedThreshold={0.2} ListFooterComponent={loadingOlder ? (<react_native_1.View style={{ padding: 8 }}>
                            <react_native_1.ActivityIndicator size="small" color={colors.primary}/>
                        </react_native_1.View>) : null}/>
            {showScrollBtn && (<react_native_1.TouchableOpacity style={styles.scrollToBottomBtn} onPress={function () { var _a; return (_a = flatListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({ offset: 0, animated: true }); }} activeOpacity={0.8}>
                    <react_native_1.Text style={styles.scrollToBottomIcon}>↓</react_native_1.Text>
                </react_native_1.TouchableOpacity>)}
            {editingMessage && (<react_native_1.View style={styles.editingBar}>
                    <react_native_1.Text style={styles.editingBarText}>Editing message</react_native_1.Text>
                    <react_native_1.TouchableOpacity onPress={function () {
                setEditingMessage(null);
                setText('');
            }}>
                        <react_native_1.Text style={styles.editingBarCancel}>Cancel</react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                </react_native_1.View>)}
            {replyingTo && (<ReplyPreviewBar_1.ReplyPreviewBar replyingTo={replyingTo} senderName={replyingTo.senderId === (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) ? 'You' : chatUser.displayName} onCancel={function () { return setReplyingTo(null); }}/>)}
            <react_native_1.View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                {isRecording ? (<>
                        <react_native_1.TouchableOpacity style={styles.cancelRecordBtn} onPress={cancelRecording}>
                            <vector_icons_1.Ionicons name="close-circle" size={28} color={colors.gray400}/>
                        </react_native_1.TouchableOpacity>
                        <react_native_1.View style={styles.recordingIndicator}>
                            <react_native_1.View style={styles.recordingDot}/>
                            <react_native_1.Text style={styles.recordingTimer}>
                                {(0, media_1.formatDuration)(recordingDuration / 1000)}
                            </react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.TouchableOpacity onPress={stopAndSendRecording} style={[styles.sendButton, styles.sendActive]}>
                            <react_native_1.Text style={[styles.sendIcon, styles.sendIconActive]}>↑</react_native_1.Text>
                        </react_native_1.TouchableOpacity>
                    </>) : (<>
                        <react_native_1.TouchableOpacity style={[styles.attachBtn, isSendingMedia && styles.attachBtnDisabled]} onPress={function () { return setShowAttachmentSheet(true); }} disabled={isSendingMedia}>
                            <vector_icons_1.Ionicons name="attach-outline" size={24} color={isSendingMedia ? colors.gray300 : colors.gray400}/>
                        </react_native_1.TouchableOpacity>
                        <react_native_1.TextInput ref={inputRef} value={text} onChangeText={function (t) {
                setText(t);
                handleTyping();
            }} placeholder="Message..." style={styles.textInput} placeholderTextColor={colors.gray400} multiline maxLength={5000}/>
                        {canSend ? (<react_native_1.TouchableOpacity onPress={handleSend} style={[styles.sendButton, styles.sendActive]}>
                                <react_native_1.Text style={[styles.sendIcon, styles.sendIconActive]}>↑</react_native_1.Text>
                            </react_native_1.TouchableOpacity>) : (<react_native_1.TouchableOpacity style={[styles.sendButton, styles.sendInactive]} onPress={startRecording}>
                                <vector_icons_1.Ionicons name="mic-outline" size={20} color={colors.gray400}/>
                            </react_native_1.TouchableOpacity>)}
                    </>)}
            </react_native_1.View>
            {selectedMessage && (<MessageActionMenu_1.MessageActionMenu message={selectedMessage} currentUserId={(_b = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) !== null && _b !== void 0 ? _b : ''} visible={showActionMenu} messageY={selectedMessageY} currentUserEmoji={(_d = (_c = selectedMessage.reactions.find(function (r) { return r.userId === (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id); })) === null || _c === void 0 ? void 0 : _c.emoji) !== null && _d !== void 0 ? _d : null} onClose={function () {
                setShowActionMenu(false);
                setSelectedMessage(null);
            }} onReact={function (emoji) {
                handleReact(emoji, selectedMessage.id);
                setShowActionMenu(false);
                setSelectedMessage(null);
            }} onOpenEmojiPicker={function () {
                setShowActionMenu(false);
                setShowEmojiPicker(true);
            }} onReply={function () {
                setReplyingTo(selectedMessage);
                setShowActionMenu(false);
                setTimeout(function () { var _a; return (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 50);
                setSelectedMessage(null);
            }} onCopy={handleCopy} onForward={function () {
                setShowForwardModal(true);
            }} onEdit={handleEditStart} onDeleteForMe={handleDeleteForMe} onDeleteForEveryone={handleDeleteForEveryone} onDetails={function () {
                setShowActionMenu(false);
                setDetailsMessage(selectedMessage);
                setSelectedMessage(null);
            }}/>)}
            {/* Message Details bottom sheet */}
            {detailsMessage &&
            (function () {
                var _a;
                var dm = detailsMessage;
                var isMyMsg = dm.senderId === (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id);
                var statusLabel = dm.status === 'read'
                    ? 'Seen'
                    : dm.status === 'delivered'
                        ? 'Delivered'
                        : dm.status === 'sent'
                            ? 'Sent'
                            : null;
                return (<react_native_1.Modal visible transparent animationType="slide" onRequestClose={function () { return setDetailsMessage(null); }}>
                            <react_native_1.TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={function () { return setDetailsMessage(null); }}/>
                            <react_native_1.View style={styles.detailsSheet}>
                                <react_native_1.View style={styles.detailsHandle}/>
                                <react_native_1.Text style={styles.detailsTitle}>Message Info</react_native_1.Text>
                                <react_native_1.View style={styles.detailsRow}>
                                    <react_native_1.Text style={styles.detailsLabel}>Sent at</react_native_1.Text>
                                    <react_native_1.Text style={styles.detailsValue}>
                                        {new Date(dm.createdAt).toLocaleString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                                    </react_native_1.Text>
                                </react_native_1.View>
                                {isMyMsg && statusLabel && (<react_native_1.View style={styles.detailsRow}>
                                        <react_native_1.Text style={styles.detailsLabel}>Status</react_native_1.Text>
                                        <react_native_1.View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                                            <MsgStatusIcon status={dm.status} size={16}/>
                                            <react_native_1.Text style={styles.detailsValue}>{statusLabel}</react_native_1.Text>
                                        </react_native_1.View>
                                    </react_native_1.View>)}
                                {dm.type === 'image' && dm.mediaUrl && (<react_native_1.View style={styles.detailsRow}>
                                        <react_native_1.Text style={styles.detailsLabel}>Type</react_native_1.Text>
                                        <react_native_1.Text style={styles.detailsValue}>Image</react_native_1.Text>
                                    </react_native_1.View>)}
                                {dm.type === 'file' && (<react_native_1.View style={styles.detailsRow}>
                                        <react_native_1.Text style={styles.detailsLabel}>File</react_native_1.Text>
                                        <react_native_1.Text style={styles.detailsValue} numberOfLines={1}>
                                            {(_a = dm.mediaName) !== null && _a !== void 0 ? _a : 'Unknown'}
                                        </react_native_1.Text>
                                    </react_native_1.View>)}
                                <react_native_1.TouchableOpacity style={styles.detailsClose} onPress={function () { return setDetailsMessage(null); }}>
                                    <react_native_1.Text style={styles.detailsCloseText}>Close</react_native_1.Text>
                                </react_native_1.TouchableOpacity>
                            </react_native_1.View>
                        </react_native_1.Modal>);
            })()}
            <EmojiPickerModal_1.EmojiPickerModal visible={showEmojiPicker} currentUserEmoji={(_f = (_e = selectedMessage === null || selectedMessage === void 0 ? void 0 : selectedMessage.reactions.find(function (r) { return r.userId === (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id); })) === null || _e === void 0 ? void 0 : _e.emoji) !== null && _f !== void 0 ? _f : null} onReact={function (emoji) {
            handleReact(emoji, selectedMessage.id);
            setShowEmojiPicker(false);
            setSelectedMessage(null);
        }} onClose={function () {
            setShowEmojiPicker(false);
            setSelectedMessage(null);
        }}/>
            <ForwardModal_1.ForwardModal visible={showForwardModal} message={selectedMessage} onClose={function () { return setShowForwardModal(false); }} onForward={handleForward} excludeConversationId={conversationId}/>
            <AttachmentSheet_1.AttachmentSheet visible={showAttachmentSheet} onClose={function () { return setShowAttachmentSheet(false); }} onGallery={function () { return handlePickImage('gallery'); }} onCamera={function () { return handlePickImage('camera'); }} onFile={handlePickFile}/>
            <ImagePreviewScreen_1.ImagePreviewScreen visible={previewImageUri !== null} uri={previewImageUri} onSend={handleSendImage} onCancel={function () { return setPreviewImageUri(null); }} isSending={isSendingMedia}/>
            <ImageViewerModal_1.ImageViewerModal visible={viewingImageUrl !== null} imageUrl={viewingImageUrl} onClose={function () {
            setViewingImageUrl(null);
            setViewingImageMeta(null);
        }} senderName={viewingImageMeta === null || viewingImageMeta === void 0 ? void 0 : viewingImageMeta.name} senderAvatarUrl={viewingImageMeta === null || viewingImageMeta === void 0 ? void 0 : viewingImageMeta.avatarUrl} senderColor={viewingImageMeta === null || viewingImageMeta === void 0 ? void 0 : viewingImageMeta.color} sentAt={viewingImageMeta === null || viewingImageMeta === void 0 ? void 0 : viewingImageMeta.sentAt}/>
        </react_native_1.KeyboardAvoidingView>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.white },
        messagesList: { paddingVertical: 8 },
        scrollToBottomBtn: {
            position: 'absolute',
            bottom: 80,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
            borderWidth: react_native_1.StyleSheet.hairlineWidth,
            borderColor: colors.gray100,
        },
        scrollToBottomIcon: {
            fontSize: 18,
            color: colors.gray400,
            lineHeight: 22,
        },
        headerRow: { flexDirection: 'row', alignItems: 'center' },
        headerInfo: { marginLeft: 8 },
        headerName: { fontSize: 16, fontWeight: '600', color: colors.dark },
        headerStatus: { fontSize: 12, color: colors.gray400 },
        messageRow: {
            marginHorizontal: 8,
            marginVertical: 1,
            flexDirection: 'row',
            alignItems: 'flex-end',
        },
        messageRowEnd: { justifyContent: 'flex-end' },
        messageRowStart: { justifyContent: 'flex-start' },
        sectionBottom: { marginBottom: 4 },
        sectionMiddle: { marginBottom: 1 },
        avatarCol: {
            width: 36,
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginRight: 4,
            flexShrink: 0,
        },
        messageBubble: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
        bubbleMe: { backgroundColor: colors.primary },
        bubbleOther: { backgroundColor: colors.gray50 },
        messageText: { fontSize: 16 },
        textMe: { color: '#FFFFFF' },
        textOther: { color: colors.dark },
        messageFooter: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginTop: 2,
            gap: 4,
        },
        metaText: { fontSize: 10 },
        metaMe: { color: 'rgba(255,255,255,0.6)' },
        metaOther: { color: colors.gray400 },
        // Image bubble — no background container
        imageBubble: {
            maxWidth: 240,
            borderRadius: 18,
            overflow: 'hidden',
        },
        imageTimeOverlay: {
            position: 'absolute',
            bottom: 6,
            right: 8,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.35)',
            borderRadius: 10,
            paddingHorizontal: 6,
            paddingVertical: 2,
        },
        imageTimeText: { color: '#fff', fontSize: 10, fontWeight: '500' },
        bubbleFailed: { opacity: 0.7 },
        sendingText: { fontSize: 10, color: colors.gray400, marginTop: 2, alignSelf: 'flex-end' },
        failedText: { fontSize: 11, color: colors.red, marginTop: 2, alignSelf: 'flex-end' },
        // Messenger status row
        statusRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 2,
            marginHorizontal: 4,
            marginBottom: 2,
        },
        statusDate: { fontSize: 10, color: colors.gray400, marginRight: 2 },
        statusLabel: { fontSize: 11, color: colors.gray400 },
        // Details bottom sheet
        detailsSheet: {
            backgroundColor: colors.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingBottom: 32,
            paddingTop: 12,
        },
        detailsHandle: {
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.gray200,
            alignSelf: 'center',
            marginBottom: 16,
        },
        detailsTitle: {
            fontSize: 17,
            fontWeight: '600',
            color: colors.dark,
            textAlign: 'center',
            marginBottom: 16,
        },
        detailsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
            borderBottomColor: colors.gray100,
        },
        detailsLabel: { fontSize: 15, color: colors.gray500 },
        detailsValue: {
            fontSize: 15,
            color: colors.dark,
            fontWeight: '500',
            maxWidth: '60%',
            textAlign: 'right',
        },
        detailsClose: {
            marginTop: 20,
            alignSelf: 'center',
            paddingHorizontal: 32,
            paddingVertical: 12,
            backgroundColor: colors.gray50,
            borderRadius: 12,
        },
        detailsCloseText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
        deletedBubble: {
            backgroundColor: colors.gray50,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
        },
        deletedText: { color: colors.gray400, fontStyle: 'italic', fontSize: 14 },
        forwardedLabel: {
            fontSize: 12,
            color: colors.gray400,
            fontStyle: 'italic',
            marginBottom: 2,
            marginHorizontal: 8,
        },
        replyBubble: {
            maxWidth: '80%',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 8,
            borderLeftWidth: 2,
            marginBottom: 2,
            marginHorizontal: 8,
        },
        replyBubbleMe: { backgroundColor: 'rgba(0,132,255,0.1)', borderLeftColor: colors.primary },
        replyBubbleOther: { backgroundColor: colors.gray50, borderLeftColor: colors.gray300 },
        replyBubbleName: {
            fontSize: 11,
            fontWeight: '600',
            color: colors.primary,
            marginBottom: 1,
        },
        replyBubbleContent: { fontSize: 11, color: colors.gray500 },
        replyContainer: {
            marginHorizontal: 8,
            marginBottom: 2,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 8,
            borderLeftWidth: 2,
        },
        replyContainerMe: {
            backgroundColor: 'rgba(0,132,255,0.1)',
            borderLeftColor: colors.primary,
        },
        replyContainerOther: { backgroundColor: colors.gray50, borderLeftColor: colors.gray300 },
        replyText: { fontSize: 12, color: colors.gray500 },
        editingBar: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: colors.gray50,
            borderTopWidth: 1,
            borderTopColor: colors.gray100,
        },
        editingBarText: { fontSize: 13, color: colors.gray500, fontStyle: 'italic' },
        editingBarCancel: { fontSize: 13, color: colors.primary, fontWeight: '600' },
        reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
        reactionPill: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.gray50,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginRight: 4,
            marginTop: 2,
        },
        reactionPillMine: { backgroundColor: colors.primary + '25', borderColor: colors.primary },
        reactionPillText: { fontSize: 13, color: colors.dark },
        inputBar: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.gray100,
            backgroundColor: colors.white,
        },
        attachBtn: {
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
        },
        attachBtnDisabled: { opacity: 0.4 },
        textInput: {
            flex: 1,
            backgroundColor: colors.gray50,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 24,
            fontSize: 16,
            marginRight: 8,
            color: colors.dark,
            maxHeight: 100,
        },
        sendButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
        },
        sendActive: { backgroundColor: colors.primary },
        sendInactive: { backgroundColor: colors.gray100 },
        sendIcon: { fontSize: 18, fontWeight: '700' },
        sendIconActive: { color: '#FFFFFF' },
        sendIconInactive: { color: colors.gray400 },
        cancelRecordBtn: { padding: 4, marginRight: 8 },
        recordingIndicator: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
        recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e53935' },
        recordingTimer: { fontSize: 16, color: colors.dark, fontWeight: '500', minWidth: 40 },
        recordingHint: { fontSize: 13, color: colors.gray400 },
        imageThumbnail: { width: 220, height: 220 },
        uploadOverlay: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
        },
        uploadBar: { height: 4, backgroundColor: colors.primary, borderBottomLeftRadius: 12 },
    });
}
