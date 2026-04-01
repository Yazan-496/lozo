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
exports.chatRouter = void 0;
var express_1 = require("express");
var auth_1 = require("../../shared/middleware/auth");
var error_handler_1 = require("../../shared/middleware/error-handler");
var chat_socket_1 = require("./chat.socket");
var chat_service_1 = require("./chat.service");
var router = (0, express_1.Router)();
exports.chatRouter = router;
router.use(auth_1.authenticate);
// Get or create a conversation with another user
router.post('/conversations/:userId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var conv, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, chat_service_1.getOrCreateConversation)(req.user.userId, req.params.userId)];
            case 1:
                conv = _a.sent();
                res.json(conv);
                return [3 /*break*/, 3];
            case 2:
                err_1 = _a.sent();
                next(err_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// List all conversations
router.get('/conversations', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var convs, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, chat_service_1.getConversations)(req.user.userId)];
            case 1:
                convs = _a.sent();
                res.json(convs);
                return [3 /*break*/, 3];
            case 2:
                err_2 = _a.sent();
                next(err_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get messages in a conversation (with cursor pagination)
router.get('/conversations/:conversationId/messages', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var cursor, limit, msgs, err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                cursor = req.query.cursor;
                limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
                return [4 /*yield*/, (0, chat_service_1.getMessages)(req.params.conversationId, req.user.userId, cursor, limit)];
            case 1:
                msgs = _a.sent();
                res.json(msgs);
                return [3 /*break*/, 3];
            case 2:
                err_3 = _a.sent();
                next(err_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Send a message (REST fallback — primary sending is via Socket.IO)
router.post('/conversations/:conversationId/messages', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, type, content, mediaUrl, mediaName, mediaSize, mediaDuration, replyToId, forwardedFromId, result, io, recipientSocketId, err_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, type = _a.type, content = _a.content, mediaUrl = _a.mediaUrl, mediaName = _a.mediaName, mediaSize = _a.mediaSize, mediaDuration = _a.mediaDuration, replyToId = _a.replyToId, forwardedFromId = _a.forwardedFromId;
                if (!type) {
                    throw new error_handler_1.AppError(400, 'type is required');
                }
                if (type === 'text' && !content) {
                    throw new error_handler_1.AppError(400, 'content is required for text messages');
                }
                if (['image', 'voice', 'file'].includes(type) && !mediaUrl) {
                    throw new error_handler_1.AppError(400, 'mediaUrl is required for media messages');
                }
                return [4 /*yield*/, (0, chat_service_1.sendMessage)(req.params.conversationId, req.user.userId, {
                        type: type,
                        content: content,
                        mediaUrl: mediaUrl,
                        mediaName: mediaName,
                        mediaSize: mediaSize,
                        mediaDuration: mediaDuration,
                        replyToId: replyToId,
                        forwardedFromId: forwardedFromId,
                    })];
            case 1:
                result = _b.sent();
                io = (0, chat_socket_1.getIo)();
                recipientSocketId = (0, chat_socket_1.getOnlineUsers)().get(result.recipientId);
                if (io && recipientSocketId) {
                    io.to(recipientSocketId).emit('message:new', {
                        message: result.message,
                        conversationId: req.params.conversationId,
                    });
                }
                res.status(201).json(result.message);
                return [3 /*break*/, 3];
            case 2:
                err_4 = _b.sent();
                next(err_4);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Edit a message
router.put('/messages/:messageId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var content, msg, err_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                content = req.body.content;
                if (!content) {
                    throw new error_handler_1.AppError(400, 'content is required');
                }
                return [4 /*yield*/, (0, chat_service_1.editMessage)(req.params.messageId, req.user.userId, content)];
            case 1:
                msg = _a.sent();
                res.json(msg);
                return [3 /*break*/, 3];
            case 2:
                err_5 = _a.sent();
                next(err_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Delete message for me
router.delete('/messages/:messageId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, chat_service_1.deleteForMe)(req.params.messageId, req.user.userId)];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                err_6 = _a.sent();
                next(err_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Delete message for everyone
router.delete('/messages/:messageId/everyone', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var msg, err_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, chat_service_1.deleteForEveryone)(req.params.messageId, req.user.userId)];
            case 1:
                msg = _a.sent();
                res.json(msg);
                return [3 /*break*/, 3];
            case 2:
                err_7 = _a.sent();
                next(err_7);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// React to a message
router.post('/messages/:messageId/reactions', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var emoji, result, err_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                emoji = req.body.emoji;
                if (!emoji) {
                    throw new error_handler_1.AppError(400, 'emoji is required');
                }
                return [4 /*yield*/, (0, chat_service_1.reactToMessage)(req.params.messageId, req.user.userId, emoji)];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                err_8 = _a.sent();
                next(err_8);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Remove reaction
router.delete('/messages/:messageId/reactions', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, chat_service_1.removeReaction)(req.params.messageId, req.user.userId)];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                err_9 = _a.sent();
                next(err_9);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Mark messages as delivered
router.post('/conversations/:conversationId/delivered', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, chat_service_1.markDelivered)(req.params.conversationId, req.user.userId)];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                err_10 = _a.sent();
                next(err_10);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Mark messages as read
router.post('/conversations/:conversationId/read', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, chat_service_1.markRead)(req.params.conversationId, req.user.userId)];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                err_11 = _a.sent();
                next(err_11);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Delete conversation for me or everyone
router.delete('/conversations/:conversationId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var scope, result, result, io_1, err_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                scope = req.query.scope;
                if (scope !== 'me' && scope !== 'everyone') {
                    throw new error_handler_1.AppError(400, 'scope must be "me" or "everyone"');
                }
                if (!(scope === 'me')) return [3 /*break*/, 2];
                return [4 /*yield*/, (0, chat_service_1.deleteConversationForMe)(req.params.conversationId, req.user.userId)];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, (0, chat_service_1.deleteConversationForEveryone)(req.params.conversationId, req.user.userId)];
            case 3:
                result = _a.sent();
                io_1 = (0, chat_socket_1.getIo)();
                if (io_1) {
                    result.participantIds.forEach(function (participantId) {
                        var socketId = (0, chat_socket_1.getOnlineUsers)().get(participantId);
                        if (socketId) {
                            io_1.to(socketId).emit('conversation:deleted', {
                                conversationId: req.params.conversationId,
                            });
                        }
                    });
                }
                res.json(result);
                _a.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                err_12 = _a.sent();
                next(err_12);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
