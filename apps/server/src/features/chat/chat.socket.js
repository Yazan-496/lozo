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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnlineUsers = getOnlineUsers;
exports.getIo = getIo;
exports.setupChatSocket = setupChatSocket;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var drizzle_orm_1 = require("drizzle-orm");
var db_1 = require("../../shared/db");
var schema_1 = require("../../shared/db/schema");
var chat_service_1 = require("./chat.service");
// Map userId -> socketId for presence and direct messaging
var onlineUsers = new Map();
function getOnlineUsers() {
    return onlineUsers;
}
var _io = null;
function getIo() {
    return _io;
}
function setupChatSocket(io) {
    var _this = this;
    _io = io;
    // Auth middleware for Socket.IO
    io.use(function (socket, next) {
        var token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            var payload = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
            socket.data.user = payload;
            next();
        }
        catch (_a) {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', function (socket) { return __awaiter(_this, void 0, void 0, function () {
        var userId, senderProfile;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    userId = socket.data.user.userId;
                    onlineUsers.set(userId, socket.id);
                    // Mark user as online
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.users)
                            .set({ isOnline: true, lastSeenAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))];
                case 1:
                    // Mark user as online
                    _a.sent();
                    return [4 /*yield*/, db_1.db
                            .select({
                            id: schema_1.users.id,
                            displayName: schema_1.users.displayName,
                            avatarUrl: schema_1.users.avatarUrl,
                            avatarColor: schema_1.users.avatarColor,
                        })
                            .from(schema_1.users)
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                            .limit(1)];
                case 2:
                    senderProfile = (_a.sent())[0];
                    socket.data.profile = senderProfile;
                    // Broadcast online status to all connected users
                    socket.broadcast.emit('user:online', { userId: userId });
                    console.log("User connected: ".concat(socket.data.user.username, " (").concat(socket.id, ")"));
                    // Send message
                    socket.on('message:send', function (data, callback) { return __awaiter(_this, void 0, void 0, function () {
                        var result, recipientSocketId, err_1;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, (0, chat_service_1.sendMessage)(data.conversationId, userId, {
                                            type: data.type || 'text',
                                            content: data.content,
                                            mediaUrl: data.mediaUrl,
                                            mediaName: data.mediaName,
                                            mediaSize: data.mediaSize,
                                            mediaDuration: data.mediaDuration,
                                            replyToId: data.replyToId,
                                            forwardedFromId: data.forwardedFromId,
                                        })];
                                case 1:
                                    result = _b.sent();
                                    recipientSocketId = onlineUsers.get(result.recipientId);
                                    if (recipientSocketId) {
                                        io.to(recipientSocketId).emit('message:new', {
                                            message: result.message,
                                            conversationId: data.conversationId,
                                            sender: (_a = socket.data.profile) !== null && _a !== void 0 ? _a : null,
                                        });
                                    }
                                    // Echo back localId for client reconciliation
                                    callback === null || callback === void 0 ? void 0 : callback({ success: true, message: __assign(__assign({}, result.message), { localId: data.localId }) });
                                    return [3 /*break*/, 3];
                                case 2:
                                    err_1 = _b.sent();
                                    callback === null || callback === void 0 ? void 0 : callback({ success: false, error: err_1.message });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Edit message
                    socket.on('message:edit', function (data, callback) { return __awaiter(_this, void 0, void 0, function () {
                        var updated, recipientSocketId, err_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, (0, chat_service_1.editMessage)(data.messageId, userId, data.content)];
                                case 1:
                                    updated = _a.sent();
                                    recipientSocketId = onlineUsers.get(data.recipientId);
                                    if (recipientSocketId) {
                                        io.to(recipientSocketId).emit('message:edited', {
                                            message: updated,
                                            conversationId: data.conversationId,
                                        });
                                    }
                                    callback === null || callback === void 0 ? void 0 : callback({ success: true, message: updated });
                                    return [3 /*break*/, 3];
                                case 2:
                                    err_2 = _a.sent();
                                    callback === null || callback === void 0 ? void 0 : callback({ success: false, error: err_2.message });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Delete for everyone
                    socket.on('message:delete', function (data, callback) { return __awaiter(_this, void 0, void 0, function () {
                        var deleted, recipientSocketId, err_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, (0, chat_service_1.deleteForEveryone)(data.messageId, userId)];
                                case 1:
                                    deleted = _a.sent();
                                    recipientSocketId = onlineUsers.get(data.recipientId);
                                    if (recipientSocketId) {
                                        io.to(recipientSocketId).emit('message:deleted', {
                                            messageId: data.messageId,
                                            conversationId: data.conversationId,
                                        });
                                    }
                                    callback === null || callback === void 0 ? void 0 : callback({ success: true });
                                    return [3 /*break*/, 3];
                                case 2:
                                    err_3 = _a.sent();
                                    callback === null || callback === void 0 ? void 0 : callback({ success: false, error: err_3.message });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Reaction
                    socket.on('message:react', function (data, callback) { return __awaiter(_this, void 0, void 0, function () {
                        var result, recipientSocketId, err_4;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, (0, chat_service_1.reactToMessage)(data.messageId, userId, data.emoji)];
                                case 1:
                                    result = _a.sent();
                                    recipientSocketId = onlineUsers.get(data.recipientId);
                                    if (recipientSocketId) {
                                        io.to(recipientSocketId).emit('message:reaction', {
                                            messageId: data.messageId,
                                            userId: userId,
                                            emoji: data.emoji,
                                            action: result.action,
                                            conversationId: data.conversationId,
                                        });
                                    }
                                    callback === null || callback === void 0 ? void 0 : callback(__assign({ success: true }, result));
                                    return [3 /*break*/, 3];
                                case 2:
                                    err_4 = _a.sent();
                                    callback === null || callback === void 0 ? void 0 : callback({ success: false, error: err_4.message });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Typing indicator
                    socket.on('typing:start', function (data) {
                        var recipientSocketId = onlineUsers.get(data.recipientId);
                        if (recipientSocketId) {
                            io.to(recipientSocketId).emit('typing:start', {
                                userId: userId,
                                conversationId: data.conversationId,
                            });
                        }
                    });
                    socket.on('typing:stop', function (data) {
                        var recipientSocketId = onlineUsers.get(data.recipientId);
                        if (recipientSocketId) {
                            io.to(recipientSocketId).emit('typing:stop', {
                                userId: userId,
                                conversationId: data.conversationId,
                            });
                        }
                    });
                    // Mark delivered
                    socket.on('messages:delivered', function (data, callback) { return __awaiter(_this, void 0, void 0, function () {
                        var result, senderSocketId, err_5;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, (0, chat_service_1.markDelivered)(data.conversationId, userId)];
                                case 1:
                                    result = _a.sent();
                                    senderSocketId = onlineUsers.get(data.senderId);
                                    if (senderSocketId) {
                                        io.to(senderSocketId).emit('messages:status', {
                                            conversationId: data.conversationId,
                                            status: 'delivered',
                                            userId: userId,
                                        });
                                    }
                                    callback === null || callback === void 0 ? void 0 : callback(__assign({ success: true }, result));
                                    return [3 /*break*/, 3];
                                case 2:
                                    err_5 = _a.sent();
                                    callback === null || callback === void 0 ? void 0 : callback({ success: false, error: err_5.message });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Mark read
                    socket.on('messages:read', function (data, callback) { return __awaiter(_this, void 0, void 0, function () {
                        var result, senderSocketId, err_6;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, (0, chat_service_1.markRead)(data.conversationId, userId)];
                                case 1:
                                    result = _a.sent();
                                    senderSocketId = onlineUsers.get(data.senderId);
                                    if (senderSocketId) {
                                        io.to(senderSocketId).emit('messages:status', {
                                            conversationId: data.conversationId,
                                            status: 'read',
                                            userId: userId,
                                        });
                                    }
                                    callback === null || callback === void 0 ? void 0 : callback(__assign({ success: true }, result));
                                    return [3 /*break*/, 3];
                                case 2:
                                    err_6 = _a.sent();
                                    callback === null || callback === void 0 ? void 0 : callback({ success: false, error: err_6.message });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Disconnect
                    socket.on('disconnect', function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    onlineUsers.delete(userId);
                                    return [4 /*yield*/, db_1.db
                                            .update(schema_1.users)
                                            .set({ isOnline: false, lastSeenAt: new Date() })
                                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))];
                                case 1:
                                    _a.sent();
                                    socket.broadcast.emit('user:offline', {
                                        userId: userId,
                                        lastSeenAt: new Date().toISOString(),
                                    });
                                    console.log("User disconnected: ".concat(socket.data.user.username));
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    }); });
}
