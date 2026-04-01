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
exports.upsertConversations = upsertConversations;
exports.getCachedConversations = getCachedConversations;
exports.hideCachedConversation = hideCachedConversation;
exports.syncConversations = syncConversations;
var sqlite_1 = require("./sqlite");
function upsertConversations(convs) {
    return __awaiter(this, void 0, void 0, function () {
        var db, _i, convs_1, conv;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    _i = 0, convs_1 = convs;
                    _a.label = 1;
                case 1:
                    if (!(_i < convs_1.length)) return [3 /*break*/, 4];
                    conv = convs_1[_i];
                    return [4 /*yield*/, db.runAsync("INSERT OR REPLACE INTO conversations (id, other_user, last_message, unread_count, updated_at)\n       VALUES (?, ?, ?, ?, ?)", [
                            conv.id,
                            JSON.stringify(conv.otherUser),
                            conv.lastMessage ? JSON.stringify(conv.lastMessage) : null,
                            conv.unreadCount,
                            conv.updatedAt,
                        ])];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getCachedConversations() {
    return __awaiter(this, void 0, void 0, function () {
        var db, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    return [4 /*yield*/, db.getAllAsync("SELECT * FROM conversations ORDER BY updated_at DESC")];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows.map(function (row) { return ({
                            id: row.id,
                            otherUser: JSON.parse(row.other_user),
                            lastMessage: row.last_message ? JSON.parse(row.last_message) : null,
                            unreadCount: row.unread_count,
                            updatedAt: row.updated_at,
                        }); })];
            }
        });
    });
}
function hideCachedConversation(id) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    return [4 /*yield*/, db.runAsync("DELETE FROM conversations WHERE id = ?", [id])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Replace the local cache with exactly the server's list — removes stale/deleted rows
function syncConversations(convs) {
    return __awaiter(this, void 0, void 0, function () {
        var db, placeholders;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    if (!(convs.length === 0)) return [3 /*break*/, 2];
                    return [4 /*yield*/, db.runAsync("DELETE FROM conversations")];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2:
                    placeholders = convs.map(function () { return '?'; }).join(', ');
                    return [4 /*yield*/, db.runAsync("DELETE FROM conversations WHERE id NOT IN (".concat(placeholders, ")"), convs.map(function (c) { return c.id; }))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, upsertConversations(convs)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
