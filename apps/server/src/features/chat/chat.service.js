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
exports.getOrCreateConversation = getOrCreateConversation;
exports.getConversations = getConversations;
exports.sendMessage = sendMessage;
exports.getMessages = getMessages;
exports.editMessage = editMessage;
exports.deleteForMe = deleteForMe;
exports.deleteForEveryone = deleteForEveryone;
exports.reactToMessage = reactToMessage;
exports.removeReaction = removeReaction;
exports.markDelivered = markDelivered;
exports.markRead = markRead;
exports.deleteConversationForMe = deleteConversationForMe;
exports.deleteConversationForEveryone = deleteConversationForEveryone;
var drizzle_orm_1 = require("drizzle-orm");
var db_1 = require("../../shared/db");
var schema_1 = require("../../shared/db/schema");
var error_handler_1 = require("../../shared/middleware/error-handler");
// Ensure two users are contacts before chatting
function verifyContact(userOneId, userTwoId) {
    return __awaiter(this, void 0, void 0, function () {
        var contact;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.contacts)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contacts.status, 'accepted'), (0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contacts.requesterId, userOneId), (0, drizzle_orm_1.eq)(schema_1.contacts.addresseeId, userTwoId)), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contacts.requesterId, userTwoId), (0, drizzle_orm_1.eq)(schema_1.contacts.addresseeId, userOneId)))))
                        .limit(1)];
                case 1:
                    contact = (_a.sent())[0];
                    if (!contact) {
                        throw new error_handler_1.AppError(403, 'You must be contacts to chat');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// Get or create a 1:1 conversation
function getOrCreateConversation(userId, otherUserId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, pOne, pTwo, existing, conv;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, verifyContact(userId, otherUserId)];
                case 1:
                    _b.sent();
                    _a = userId < otherUserId
                        ? [userId, otherUserId]
                        : [otherUserId, userId], pOne = _a[0], pTwo = _a[1];
                    return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.conversations)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.conversations.participantOneId, pOne), (0, drizzle_orm_1.eq)(schema_1.conversations.participantTwoId, pTwo)))
                            .limit(1)];
                case 2:
                    existing = (_b.sent())[0];
                    if (existing)
                        return [2 /*return*/, existing];
                    return [4 /*yield*/, db_1.db
                            .insert(schema_1.conversations)
                            .values({ participantOneId: pOne, participantTwoId: pTwo })
                            .returning()];
                case 3:
                    conv = (_b.sent())[0];
                    return [2 /*return*/, conv];
            }
        });
    });
}
// Get all conversations for a user with last message and other user info
function getConversations(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var rows, result;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.conversations)
                        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.conversations.participantOneId, userId), (0, drizzle_orm_1.eq)(schema_1.conversations.participantTwoId, userId)))
                        .orderBy((0, drizzle_orm_1.desc)(schema_1.conversations.updatedAt))];
                case 1:
                    rows = _a.sent();
                    return [4 /*yield*/, Promise.all(rows.map(function (conv) { return __awaiter(_this, void 0, void 0, function () {
                            var otherUserId, otherUser, deletedMessageIds, lastMessage, lastMessageStatus, statusUserId, statusRow, unreadMessages, builtLastMessage;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        otherUserId = conv.participantOneId === userId
                                            ? conv.participantTwoId
                                            : conv.participantOneId;
                                        return [4 /*yield*/, db_1.db
                                                .select({
                                                id: schema_1.users.id,
                                                username: schema_1.users.username,
                                                displayName: schema_1.users.displayName,
                                                avatarUrl: schema_1.users.avatarUrl,
                                                avatarColor: schema_1.users.avatarColor,
                                                isOnline: schema_1.users.isOnline,
                                                lastSeenAt: schema_1.users.lastSeenAt,
                                            })
                                                .from(schema_1.users)
                                                .where((0, drizzle_orm_1.eq)(schema_1.users.id, otherUserId))
                                                .limit(1)];
                                    case 1:
                                        otherUser = (_b.sent())[0];
                                        deletedMessageIds = db_1.db
                                            .select({ messageId: schema_1.messageDeletes.messageId })
                                            .from(schema_1.messageDeletes)
                                            .where((0, drizzle_orm_1.eq)(schema_1.messageDeletes.userId, userId));
                                        return [4 /*yield*/, db_1.db
                                                .select({
                                                id: schema_1.messages.id,
                                                senderId: schema_1.messages.senderId,
                                                type: schema_1.messages.type,
                                                content: schema_1.messages.content,
                                                isForwarded: schema_1.messages.isForwarded,
                                                deletedForEveryone: schema_1.messages.deletedForEveryone,
                                                createdAt: schema_1.messages.createdAt,
                                            })
                                                .from(schema_1.messages)
                                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.conversationId, conv.id), (0, drizzle_orm_1.eq)(schema_1.messages.deletedForEveryone, false)))
                                                .orderBy((0, drizzle_orm_1.desc)(schema_1.messages.createdAt))
                                                .limit(1)];
                                    case 2:
                                        lastMessage = (_b.sent())[0];
                                        lastMessageStatus = null;
                                        if (!lastMessage) return [3 /*break*/, 4];
                                        statusUserId = lastMessage.senderId === userId ? otherUserId : userId;
                                        return [4 /*yield*/, db_1.db
                                                .select({ status: schema_1.messageStatuses.status })
                                                .from(schema_1.messageStatuses)
                                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messageStatuses.messageId, lastMessage.id), (0, drizzle_orm_1.eq)(schema_1.messageStatuses.userId, statusUserId)))
                                                .limit(1)];
                                    case 3:
                                        statusRow = (_b.sent())[0];
                                        lastMessageStatus = (_a = statusRow === null || statusRow === void 0 ? void 0 : statusRow.status) !== null && _a !== void 0 ? _a : null;
                                        _b.label = 4;
                                    case 4: return [4 /*yield*/, db_1.db
                                            .select({ id: schema_1.messageStatuses.id })
                                            .from(schema_1.messageStatuses)
                                            .innerJoin(schema_1.messages, (0, drizzle_orm_1.eq)(schema_1.messages.id, schema_1.messageStatuses.messageId))
                                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.conversationId, conv.id), (0, drizzle_orm_1.eq)(schema_1.messageStatuses.userId, userId), (0, drizzle_orm_1.ne)(schema_1.messageStatuses.status, 'read')))];
                                    case 5:
                                        unreadMessages = _b.sent();
                                        builtLastMessage = lastMessage
                                            ? __assign(__assign({}, (lastMessage.deletedForEveryone
                                                ? __assign(__assign({}, lastMessage), { content: null, type: 'text' }) : lastMessage)), { status: lastMessageStatus }) : null;
                                        return [2 /*return*/, {
                                                id: conv.id,
                                                otherUser: otherUser,
                                                lastMessage: builtLastMessage,
                                                unreadCount: unreadMessages.length,
                                                updatedAt: conv.updatedAt,
                                            }];
                                }
                            });
                        }); }))];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
// Send a message
function sendMessage(conversationId, senderId, data) {
    return __awaiter(this, void 0, void 0, function () {
        var conv, recipientId, blocked, isForwarded, message, replyTo, replyMsg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.conversations)
                        .where((0, drizzle_orm_1.eq)(schema_1.conversations.id, conversationId))
                        .limit(1)];
                case 1:
                    conv = (_a.sent())[0];
                    if (!conv) {
                        throw new error_handler_1.AppError(404, 'Conversation not found');
                    }
                    if (conv.participantOneId !== senderId && conv.participantTwoId !== senderId) {
                        throw new error_handler_1.AppError(403, 'Not a participant in this conversation');
                    }
                    recipientId = conv.participantOneId === senderId
                        ? conv.participantTwoId
                        : conv.participantOneId;
                    return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.blockedUsers)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockerId, recipientId), (0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockedId, senderId)))
                            .limit(1)];
                case 2:
                    blocked = (_a.sent())[0];
                    if (blocked) {
                        throw new error_handler_1.AppError(403, 'Cannot send message to this user');
                    }
                    isForwarded = !!data.forwardedFromId;
                    return [4 /*yield*/, db_1.db
                            .insert(schema_1.messages)
                            .values({
                            conversationId: conversationId,
                            senderId: senderId,
                            type: data.type,
                            content: data.content,
                            mediaUrl: data.mediaUrl,
                            mediaName: data.mediaName,
                            mediaSize: data.mediaSize,
                            mediaDuration: data.mediaDuration,
                            replyToId: data.replyToId,
                            forwardedFromId: data.forwardedFromId,
                            isForwarded: isForwarded,
                        })
                            .returning()];
                case 3:
                    message = (_a.sent())[0];
                    // Create status entry for recipient (sent)
                    return [4 /*yield*/, db_1.db.insert(schema_1.messageStatuses).values({
                            messageId: message.id,
                            userId: recipientId,
                            status: 'sent',
                        })];
                case 4:
                    // Create status entry for recipient (sent)
                    _a.sent();
                    // Update conversation's last message and timestamp
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.conversations)
                            .set({ lastMessageId: message.id, updatedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.conversations.id, conversationId))];
                case 5:
                    // Update conversation's last message and timestamp
                    _a.sent();
                    replyTo = null;
                    if (!message.replyToId) return [3 /*break*/, 7];
                    return [4 /*yield*/, db_1.db
                            .select({
                            id: schema_1.messages.id,
                            senderId: schema_1.messages.senderId,
                            type: schema_1.messages.type,
                            content: schema_1.messages.content,
                            deletedForEveryone: schema_1.messages.deletedForEveryone,
                        })
                            .from(schema_1.messages)
                            .where((0, drizzle_orm_1.eq)(schema_1.messages.id, message.replyToId))
                            .limit(1)];
                case 6:
                    replyMsg = (_a.sent())[0];
                    replyTo = replyMsg !== null && replyMsg !== void 0 ? replyMsg : null;
                    _a.label = 7;
                case 7: return [2 /*return*/, { message: __assign(__assign({}, message), { reactions: [], replyTo: replyTo }), recipientId: recipientId }];
            }
        });
    });
}
// Get messages for a conversation with pagination
function getMessages(conversationId_1, userId_1, cursor_1) {
    return __awaiter(this, arguments, void 0, function (conversationId, userId, cursor, // message id to paginate from
    limit) {
        var conv, deletedIds, deletedIdList, query, cursorMsg, rows, enriched;
        var _this = this;
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.conversations)
                        .where((0, drizzle_orm_1.eq)(schema_1.conversations.id, conversationId))
                        .limit(1)];
                case 1:
                    conv = (_a.sent())[0];
                    if (!conv) {
                        throw new error_handler_1.AppError(404, 'Conversation not found');
                    }
                    if (conv.participantOneId !== userId && conv.participantTwoId !== userId) {
                        throw new error_handler_1.AppError(403, 'Not a participant');
                    }
                    return [4 /*yield*/, db_1.db
                            .select({ messageId: schema_1.messageDeletes.messageId })
                            .from(schema_1.messageDeletes)
                            .where((0, drizzle_orm_1.eq)(schema_1.messageDeletes.userId, userId))];
                case 2:
                    deletedIds = _a.sent();
                    deletedIdList = deletedIds.map(function (d) { return d.messageId; });
                    query = db_1.db
                        .select()
                        .from(schema_1.messages)
                        .where(drizzle_orm_1.and.apply(void 0, __spreadArray([(0, drizzle_orm_1.eq)(schema_1.messages.conversationId, conversationId)], (deletedIdList.length > 0 ? [(0, drizzle_orm_1.notInArray)(schema_1.messages.id, deletedIdList)] : []), false)))
                        .orderBy((0, drizzle_orm_1.desc)(schema_1.messages.createdAt))
                        .limit(limit);
                    if (!cursor) return [3 /*break*/, 4];
                    return [4 /*yield*/, db_1.db
                            .select({ createdAt: schema_1.messages.createdAt })
                            .from(schema_1.messages)
                            .where((0, drizzle_orm_1.eq)(schema_1.messages.id, cursor))
                            .limit(1)];
                case 3:
                    cursorMsg = (_a.sent())[0];
                    if (cursorMsg) {
                        query = db_1.db
                            .select()
                            .from(schema_1.messages)
                            .where(drizzle_orm_1.and.apply(void 0, __spreadArray([(0, drizzle_orm_1.eq)(schema_1.messages.conversationId, conversationId),
                            (0, drizzle_orm_1.lt)(schema_1.messages.createdAt, cursorMsg.createdAt)], (deletedIdList.length > 0 ? [(0, drizzle_orm_1.notInArray)(schema_1.messages.id, deletedIdList)] : []), false)))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.messages.createdAt))
                            .limit(limit);
                    }
                    _a.label = 4;
                case 4: return [4 /*yield*/, query];
                case 5:
                    rows = _a.sent();
                    return [4 /*yield*/, Promise.all(rows.map(function (msg) { return __awaiter(_this, void 0, void 0, function () {
                            var reactions, replyTo, original, status, msgStatus;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        // Replace content if deleted for everyone
                                        if (msg.deletedForEveryone) {
                                            return [2 /*return*/, __assign(__assign({}, msg), { content: null, mediaUrl: null, reactions: [], replyTo: null, status: null })];
                                        }
                                        return [4 /*yield*/, db_1.db
                                                .select({
                                                emoji: schema_1.messageReactions.emoji,
                                                userId: schema_1.messageReactions.userId,
                                            })
                                                .from(schema_1.messageReactions)
                                                .where((0, drizzle_orm_1.eq)(schema_1.messageReactions.messageId, msg.id))];
                                    case 1:
                                        reactions = _a.sent();
                                        replyTo = null;
                                        if (!msg.replyToId) return [3 /*break*/, 3];
                                        return [4 /*yield*/, db_1.db
                                                .select({
                                                id: schema_1.messages.id,
                                                senderId: schema_1.messages.senderId,
                                                type: schema_1.messages.type,
                                                content: schema_1.messages.content,
                                                deletedForEveryone: schema_1.messages.deletedForEveryone,
                                            })
                                                .from(schema_1.messages)
                                                .where((0, drizzle_orm_1.eq)(schema_1.messages.id, msg.replyToId))
                                                .limit(1)];
                                    case 2:
                                        original = (_a.sent())[0];
                                        replyTo = original || null;
                                        _a.label = 3;
                                    case 3:
                                        status = null;
                                        if (!(msg.senderId === userId)) return [3 /*break*/, 5];
                                        return [4 /*yield*/, db_1.db
                                                .select({ status: schema_1.messageStatuses.status })
                                                .from(schema_1.messageStatuses)
                                                .where((0, drizzle_orm_1.eq)(schema_1.messageStatuses.messageId, msg.id))
                                                .limit(1)];
                                    case 4:
                                        msgStatus = (_a.sent())[0];
                                        status = (msgStatus === null || msgStatus === void 0 ? void 0 : msgStatus.status) || 'sent';
                                        _a.label = 5;
                                    case 5: return [2 /*return*/, __assign(__assign({}, msg), { reactions: reactions, replyTo: replyTo, status: status })];
                                }
                            });
                        }); }))];
                case 6:
                    enriched = _a.sent();
                    return [2 /*return*/, enriched];
            }
        });
    });
}
// Edit a message (only sender, only text)
function editMessage(messageId, userId, newContent) {
    return __awaiter(this, void 0, void 0, function () {
        var msg, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.messages)
                        .where((0, drizzle_orm_1.eq)(schema_1.messages.id, messageId))
                        .limit(1)];
                case 1:
                    msg = (_a.sent())[0];
                    if (!msg) {
                        throw new error_handler_1.AppError(404, 'Message not found');
                    }
                    if (msg.senderId !== userId) {
                        throw new error_handler_1.AppError(403, 'Can only edit your own messages');
                    }
                    if (msg.type !== 'text') {
                        throw new error_handler_1.AppError(400, 'Can only edit text messages');
                    }
                    if (msg.deletedForEveryone) {
                        throw new error_handler_1.AppError(400, 'Cannot edit a deleted message');
                    }
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.messages)
                            .set({ content: newContent, editedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.messages.id, messageId))
                            .returning()];
                case 2:
                    updated = (_a.sent())[0];
                    return [2 /*return*/, updated];
            }
        });
    });
}
// Delete message for me
function deleteForMe(messageId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select({ id: schema_1.messages.id })
                        .from(schema_1.messages)
                        .where((0, drizzle_orm_1.eq)(schema_1.messages.id, messageId))
                        .limit(1)];
                case 1:
                    msg = (_a.sent())[0];
                    if (!msg) {
                        throw new error_handler_1.AppError(404, 'Message not found');
                    }
                    return [4 /*yield*/, db_1.db
                            .insert(schema_1.messageDeletes)
                            .values({ messageId: messageId, userId: userId })
                            .onConflictDoNothing()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    });
}
// Delete message for everyone (only sender)
function deleteForEveryone(messageId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var msg, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.messages)
                        .where((0, drizzle_orm_1.eq)(schema_1.messages.id, messageId))
                        .limit(1)];
                case 1:
                    msg = (_a.sent())[0];
                    if (!msg) {
                        throw new error_handler_1.AppError(404, 'Message not found');
                    }
                    if (msg.senderId !== userId) {
                        throw new error_handler_1.AppError(403, 'Can only delete your own messages for everyone');
                    }
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.messages)
                            .set({ deletedForEveryone: true })
                            .where((0, drizzle_orm_1.eq)(schema_1.messages.id, messageId))
                            .returning()];
                case 2:
                    updated = (_a.sent())[0];
                    return [2 /*return*/, updated];
            }
        });
    });
}
// Add/update reaction
function reactToMessage(messageId, userId, emoji) {
    return __awaiter(this, void 0, void 0, function () {
        var msg, existing;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select({ id: schema_1.messages.id, conversationId: schema_1.messages.conversationId })
                        .from(schema_1.messages)
                        .where((0, drizzle_orm_1.eq)(schema_1.messages.id, messageId))
                        .limit(1)];
                case 1:
                    msg = (_a.sent())[0];
                    if (!msg) {
                        throw new error_handler_1.AppError(404, 'Message not found');
                    }
                    return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.messageReactions)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messageReactions.messageId, messageId), (0, drizzle_orm_1.eq)(schema_1.messageReactions.userId, userId)))
                            .limit(1)];
                case 2:
                    existing = (_a.sent())[0];
                    if (!existing) return [3 /*break*/, 6];
                    if (!(existing.emoji === emoji)) return [3 /*break*/, 4];
                    // Same emoji = remove reaction
                    return [4 /*yield*/, db_1.db.delete(schema_1.messageReactions).where((0, drizzle_orm_1.eq)(schema_1.messageReactions.id, existing.id))];
                case 3:
                    // Same emoji = remove reaction
                    _a.sent();
                    return [2 /*return*/, { action: 'removed', emoji: emoji }];
                case 4: 
                // Different emoji = update
                return [4 /*yield*/, db_1.db
                        .update(schema_1.messageReactions)
                        .set({ emoji: emoji, createdAt: new Date() })
                        .where((0, drizzle_orm_1.eq)(schema_1.messageReactions.id, existing.id))];
                case 5:
                    // Different emoji = update
                    _a.sent();
                    return [2 /*return*/, { action: 'updated', emoji: emoji }];
                case 6: return [4 /*yield*/, db_1.db
                        .insert(schema_1.messageReactions)
                        .values({ messageId: messageId, userId: userId, emoji: emoji })];
                case 7:
                    _a.sent();
                    return [2 /*return*/, { action: 'added', emoji: emoji, conversationId: msg.conversationId }];
            }
        });
    });
}
// Remove reaction
function removeReaction(messageId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .delete(schema_1.messageReactions)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messageReactions.messageId, messageId), (0, drizzle_orm_1.eq)(schema_1.messageReactions.userId, userId)))];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    });
}
// Mark messages as delivered
function markDelivered(conversationId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var msgs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select({ id: schema_1.messageStatuses.id })
                        .from(schema_1.messageStatuses)
                        .innerJoin(schema_1.messages, (0, drizzle_orm_1.eq)(schema_1.messages.id, schema_1.messageStatuses.messageId))
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.conversationId, conversationId), (0, drizzle_orm_1.eq)(schema_1.messageStatuses.userId, userId), (0, drizzle_orm_1.eq)(schema_1.messageStatuses.status, 'sent')))];
                case 1:
                    msgs = _a.sent();
                    if (msgs.length === 0)
                        return [2 /*return*/, { updated: 0 }];
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.messageStatuses)
                            .set({ status: 'delivered', deliveredAt: new Date() })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messageStatuses.userId, userId), (0, drizzle_orm_1.eq)(schema_1.messageStatuses.status, 'sent')))];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { updated: msgs.length }];
            }
        });
    });
}
// Mark messages as read
function markRead(conversationId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var msgs, now;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select({ id: schema_1.messageStatuses.id, messageId: schema_1.messageStatuses.messageId })
                        .from(schema_1.messageStatuses)
                        .innerJoin(schema_1.messages, (0, drizzle_orm_1.eq)(schema_1.messages.id, schema_1.messageStatuses.messageId))
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.conversationId, conversationId), (0, drizzle_orm_1.eq)(schema_1.messageStatuses.userId, userId), (0, drizzle_orm_1.ne)(schema_1.messageStatuses.status, 'read')))];
                case 1:
                    msgs = _a.sent();
                    if (msgs.length === 0)
                        return [2 /*return*/, { updated: 0 }];
                    now = new Date();
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.messageStatuses)
                            .set({ status: 'read', readAt: now, deliveredAt: now })
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messageStatuses.userId, userId), (0, drizzle_orm_1.ne)(schema_1.messageStatuses.status, 'read')))];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { updated: msgs.length }];
            }
        });
    });
}
// Delete conversation for current user only (clears message history)
function deleteConversationForMe(conversationId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var conv, messageIds;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.conversations)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.conversations.id, conversationId), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.conversations.participantOneId, userId), (0, drizzle_orm_1.eq)(schema_1.conversations.participantTwoId, userId))))
                        .limit(1)];
                case 1:
                    conv = (_a.sent())[0];
                    if (!conv) {
                        throw new error_handler_1.AppError(403, 'Not authorized to delete this conversation');
                    }
                    return [4 /*yield*/, db_1.db
                            .select({ id: schema_1.messages.id })
                            .from(schema_1.messages)
                            .where((0, drizzle_orm_1.eq)(schema_1.messages.conversationId, conversationId))];
                case 2:
                    messageIds = _a.sent();
                    if (!(messageIds.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, db_1.db
                            .insert(schema_1.messageDeletes)
                            .values(messageIds.map(function (msg) { return ({ messageId: msg.id, userId: userId }); }))
                            .onConflictDoNothing()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, { success: true, deletedCount: messageIds.length }];
            }
        });
    });
}
// Delete conversation for everyone (permanent deletion)
function deleteConversationForEveryone(conversationId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var conv, msgIds, ids;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.conversations)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.conversations.id, conversationId), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.conversations.participantOneId, userId), (0, drizzle_orm_1.eq)(schema_1.conversations.participantTwoId, userId))))
                        .limit(1)];
                case 1:
                    conv = (_a.sent())[0];
                    if (!conv) {
                        throw new error_handler_1.AppError(403, 'Not authorized to delete this conversation');
                    }
                    return [4 /*yield*/, db_1.db
                            .select({ id: schema_1.messages.id })
                            .from(schema_1.messages)
                            .where((0, drizzle_orm_1.eq)(schema_1.messages.conversationId, conversationId))];
                case 2:
                    msgIds = _a.sent();
                    if (!(msgIds.length > 0)) return [3 /*break*/, 7];
                    ids = msgIds.map(function (m) { return m.id; });
                    return [4 /*yield*/, db_1.db.delete(schema_1.messageReactions).where((0, drizzle_orm_1.inArray)(schema_1.messageReactions.messageId, ids))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, db_1.db.delete(schema_1.messageStatuses).where((0, drizzle_orm_1.inArray)(schema_1.messageStatuses.messageId, ids))];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, db_1.db.delete(schema_1.messageDeletes).where((0, drizzle_orm_1.inArray)(schema_1.messageDeletes.messageId, ids))];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, db_1.db.delete(schema_1.messages).where((0, drizzle_orm_1.inArray)(schema_1.messages.id, ids))];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [4 /*yield*/, db_1.db.delete(schema_1.conversations).where((0, drizzle_orm_1.eq)(schema_1.conversations.id, conversationId))];
                case 8:
                    _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            participantIds: [conv.participantOneId, conv.participantTwoId],
                        }];
            }
        });
    });
}
