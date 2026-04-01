"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocket = getSocket;
exports.connectSocket = connectSocket;
exports.disconnectSocket = disconnectSocket;
var react_native_1 = require("react-native");
var socket_io_client_1 = require("socket.io-client");
var api_1 = require("./api");
var auth_1 = require("../stores/auth");
var presence_1 = require("../stores/presence");
var conversations_1 = require("../stores/conversations");
var network_1 = require("../stores/network");
var conversations_db_ts_1 = require("../db/conversations.db.ts");
var InAppNotification_1 = require("../components/InAppNotification");
var socket = null;
function getSocket() {
    return socket;
}
function connectSocket() {
    var token = auth_1.useAuthStore.getState().accessToken;
    if (!token || (socket === null || socket === void 0 ? void 0 : socket.connected))
        return;
    socket = (0, socket_io_client_1.io)(api_1.BASE_URL, {
        auth: { token: token },
        transports: ['websocket'],
    });
    socket.on('connect', function () {
        console.log('Socket connected:', socket === null || socket === void 0 ? void 0 : socket.id);
        network_1.useNetworkStore.getState().setOnline(true);
        // Flush any queued messages
        Promise.resolve().then(function () { return __importStar(require('./outbox')); }).then(function (_a) {
            var flush = _a.flush;
            return void flush();
        });
    });
    socket.on('disconnect', function () {
        console.log('Socket disconnected');
        network_1.useNetworkStore.getState().setOnline(false);
    });
    socket.on('connect_error', function (err) {
        console.log('Socket error:', err.message);
    });
    socket.on('user:online', function (_a) {
        var userId = _a.userId;
        presence_1.usePresenceStore.getState().setOnline(userId);
    });
    socket.on('user:offline', function (_a) {
        var userId = _a.userId, lastSeenAt = _a.lastSeenAt;
        presence_1.usePresenceStore.getState().setOffline(userId, lastSeenAt);
    });
    // Acknowledge delivery for every incoming message regardless of which screen is active
    socket.on('message:new', function (data) {
        var _a;
        socket === null || socket === void 0 ? void 0 : socket.emit('messages:delivered', {
            conversationId: data.conversationId,
            senderId: data.message.senderId,
        });
        // Show in-app banner when app is in foreground and user is not in that conversation
        if (react_native_1.AppState.currentState === 'active') {
            var currentUserId = (_a = auth_1.useAuthStore.getState().user) === null || _a === void 0 ? void 0 : _a.id;
            if (data.message.senderId === currentUserId)
                return;
            Promise.resolve().then(function () { return __importStar(require('../../navigation/navigationRef')); }).then(function (_a) {
                var _b, _c, _d, _e, _f, _g;
                var navigationRef = _a.navigationRef;
                var route = navigationRef.getCurrentRoute();
                var inThatChat = (route === null || route === void 0 ? void 0 : route.name) === 'Chat' &&
                    ((_b = route.params) === null || _b === void 0 ? void 0 : _b.conversationId) === data.conversationId;
                if (!inThatChat) {
                    // Prefer nickname over display name
                    var sender = data.sender;
                    (_c = InAppNotification_1.inAppNotifRef.current) === null || _c === void 0 ? void 0 : _c.show({
                        type: 'message',
                        senderId: data.message.senderId,
                        senderName: (_d = sender === null || sender === void 0 ? void 0 : sender.displayName) !== null && _d !== void 0 ? _d : 'Unknown',
                        senderAvatarUrl: (_e = sender === null || sender === void 0 ? void 0 : sender.avatarUrl) !== null && _e !== void 0 ? _e : null,
                        senderAvatarColor: (_f = sender === null || sender === void 0 ? void 0 : sender.avatarColor) !== null && _f !== void 0 ? _f : '#0084FF',
                        preview: data.message.type === 'text'
                            ? ((_g = data.message.content) !== null && _g !== void 0 ? _g : '...')
                            : "\uD83D\uDCCE ".concat(data.message.type),
                        conversationId: data.conversationId,
                    });
                }
            });
        }
    });
    // Contact request notification
    socket.on('contact:request', function (data) {
        var _a;
        if (react_native_1.AppState.currentState === 'active') {
            (_a = InAppNotification_1.inAppNotifRef.current) === null || _a === void 0 ? void 0 : _a.show({
                type: 'request',
                senderId: data.from.id,
                senderName: data.from.displayName,
                senderAvatarUrl: data.from.avatarUrl,
                senderAvatarColor: data.from.avatarColor,
                preview: 'sent you a friend request',
            });
        }
    });
    // Listen for conversation deletion events
    socket.on('conversation:deleted', function (data) {
        conversations_1.useConversationsStore.getState().addHiddenConversation(data.conversationId);
        void (0, conversations_db_ts_1.hideCachedConversation)(data.conversationId);
    });
    return socket;
}
function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
