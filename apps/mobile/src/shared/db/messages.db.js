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
exports.insertMessage = insertMessage;
exports.getMessages = getMessages;
exports.updateMessageStatus = updateMessageStatus;
exports.deleteMessage = deleteMessage;
exports.pruneOldMessages = pruneOldMessages;
exports.localRowToMessage = localRowToMessage;
exports.upsertServerMessage = upsertServerMessage;
var sqlite_1 = require("./sqlite");
function insertMessage(row) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    return [4 /*yield*/, db.runAsync("INSERT INTO messages (local_id, server_id, conversation_id, sender_id, type, content, media_url, media_name, media_size, media_duration, reply_to_id, is_forwarded, forwarded_from_id, edited_at, deleted_for_everyone, sync_status, created_at, server_created_at)\n     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
                            row.local_id,
                            row.server_id,
                            row.conversation_id,
                            row.sender_id,
                            row.type,
                            row.content,
                            row.media_url,
                            row.media_name,
                            row.media_size,
                            row.media_duration,
                            row.reply_to_id,
                            row.is_forwarded,
                            row.forwarded_from_id,
                            row.edited_at,
                            row.deleted_for_everyone,
                            row.sync_status,
                            row.created_at,
                            row.server_created_at,
                        ])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getMessages(conversationId_1) {
    return __awaiter(this, arguments, void 0, function (conversationId, limit, before) {
        var db, rows;
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    return [4 /*yield*/, db.getAllAsync(before
                            ? "SELECT * FROM messages WHERE conversation_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?"
                            : "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?", before ? [conversationId, before, limit] : [conversationId, limit])];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows];
            }
        });
    });
}
function updateMessageStatus(localId, updates) {
    return __awaiter(this, void 0, void 0, function () {
        var db, parts, values;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    parts = [];
                    values = [];
                    if (updates.server_id !== undefined) {
                        parts.push('server_id = ?');
                        values.push(updates.server_id);
                    }
                    if (updates.sync_status !== undefined) {
                        parts.push('sync_status = ?');
                        values.push(updates.sync_status);
                    }
                    if (updates.server_created_at !== undefined) {
                        parts.push('server_created_at = ?');
                        values.push(updates.server_created_at);
                    }
                    if (parts.length === 0)
                        return [2 /*return*/];
                    values.push(localId);
                    return [4 /*yield*/, db.runAsync("UPDATE messages SET ".concat(parts.join(', '), " WHERE local_id = ?"), values)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function deleteMessage(localId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    return [4 /*yield*/, db.runAsync('DELETE FROM messages WHERE local_id = ?', [localId])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function pruneOldMessages() {
    return __awaiter(this, arguments, void 0, function (daysOld, maxPerConversation) {
        var db;
        if (daysOld === void 0) { daysOld = 90; }
        if (maxPerConversation === void 0) { maxPerConversation = 500; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    // Delete messages older than daysOld
                    return [4 /*yield*/, db.runAsync("DELETE FROM messages WHERE datetime(created_at) < datetime('now', ? || ' days')", ["-".concat(daysOld)])];
                case 1:
                    // Delete messages older than daysOld
                    _a.sent();
                    // Keep only the most recent maxPerConversation per conversation
                    return [4 /*yield*/, db.runAsync("DELETE FROM messages WHERE local_id IN (\n      SELECT local_id FROM messages m1\n      WHERE (SELECT COUNT(*) FROM messages m2 WHERE m2.conversation_id = m1.conversation_id AND m2.created_at >= m1.created_at) > ?\n    )", [maxPerConversation])];
                case 2:
                    // Keep only the most recent maxPerConversation per conversation
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function localRowToMessage(row) {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
        id: row.server_id || row.local_id,
        localId: row.local_id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        type: row.type,
        content: row.content,
        mediaUrl: (_a = row.media_url) !== null && _a !== void 0 ? _a : null,
        mediaName: (_b = row.media_name) !== null && _b !== void 0 ? _b : null,
        mediaSize: (_c = row.media_size) !== null && _c !== void 0 ? _c : null,
        mediaDuration: (_d = row.media_duration) !== null && _d !== void 0 ? _d : null,
        replyToId: (_e = row.reply_to_id) !== null && _e !== void 0 ? _e : null,
        isForwarded: row.is_forwarded === 1,
        forwardedFromId: (_f = row.forwarded_from_id) !== null && _f !== void 0 ? _f : null,
        editedAt: (_g = row.edited_at) !== null && _g !== void 0 ? _g : null,
        deletedForEveryone: row.deleted_for_everyone === 1,
        createdAt: row.created_at,
        syncStatus: row.sync_status,
        status: null,
        reactions: [],
    };
}
function upsertServerMessage(msg, senderId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, syncStatus;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    syncStatus = senderId === msg.senderId ? 'sent' : 'delivered';
                    return [4 /*yield*/, db.runAsync("INSERT OR IGNORE INTO messages (local_id, server_id, conversation_id, sender_id, type, content, media_url, media_name, media_size, media_duration, reply_to_id, is_forwarded, forwarded_from_id, edited_at, deleted_for_everyone, sync_status, created_at, server_created_at)\n     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
                            msg.id, // use server ID as local_id for server messages
                            msg.id, // server_id
                            msg.conversationId,
                            msg.senderId,
                            msg.type,
                            msg.content,
                            msg.mediaUrl,
                            msg.mediaName,
                            msg.mediaSize,
                            msg.mediaDuration,
                            msg.replyToId,
                            msg.isForwarded ? 1 : 0,
                            msg.forwardedFromId,
                            msg.editedAt,
                            msg.deletedForEveryone ? 1 : 0,
                            syncStatus,
                            msg.createdAt,
                            msg.createdAt,
                        ])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Helper — TODO: integrate with auth store
function getCurrentUserId() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // For now, return empty — this will be bound to the actual auth context
            return [2 /*return*/, ''];
        });
    });
}
