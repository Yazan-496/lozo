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
exports.setOnMessageSynced = setOnMessageSynced;
exports.flush = flush;
exports.retry = retry;
exports.discard = discard;
var outbox_db_ts_1 = require("../db/outbox.db.ts");
var messages_db_ts_1 = require("../db/messages.db.ts");
var sqlite_1 = require("../db/sqlite");
var socket_1 = require("./socket");
var MAX_ATTEMPTS = 3;
var flushing = false;
// ChatScreen registers this to get notified when a message is confirmed by server
var onMessageSynced = null;
function setOnMessageSynced(cb) {
    onMessageSynced = cb;
}
function flush() {
    return __awaiter(this, void 0, void 0, function () {
        var items, _i, items_1, item;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (flushing)
                        return [2 /*return*/];
                    flushing = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 7, 8]);
                    return [4 /*yield*/, (0, outbox_db_ts_1.getQueuedItems)()];
                case 2:
                    items = _a.sent();
                    _i = 0, items_1 = items;
                    _a.label = 3;
                case 3:
                    if (!(_i < items_1.length)) return [3 /*break*/, 6];
                    item = items_1[_i];
                    return [4 /*yield*/, sendItem(item)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 8];
                case 7:
                    flushing = false;
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function sendItem(item) {
    return __awaiter(this, void 0, void 0, function () {
        var socket, db, rows, _a, payload, _b;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    socket = (0, socket_1.getSocket)();
                    if (!(socket === null || socket === void 0 ? void 0 : socket.connected))
                        return [2 /*return*/];
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 5, , 6]);
                    db = (0, sqlite_1.getDb)();
                    return [4 /*yield*/, db.getAllAsync("SELECT server_id FROM messages WHERE local_id = ?", [item.local_id])];
                case 2:
                    rows = _d.sent();
                    if (!((_c = rows[0]) === null || _c === void 0 ? void 0 : _c.server_id)) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, outbox_db_ts_1.removeFromOutbox)(item.local_id)];
                case 3:
                    _d.sent();
                    return [2 /*return*/];
                case 4: return [3 /*break*/, 6];
                case 5:
                    _a = _d.sent();
                    return [3 /*break*/, 6];
                case 6:
                    payload = JSON.parse(item.payload);
                    _d.label = 7;
                case 7:
                    _d.trys.push([7, 9, , 14]);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            socket.emit('message:send', payload, function (ack) {
                                var _a;
                                if (!ack.success || ack.error) {
                                    reject(new Error((_a = ack.error) !== null && _a !== void 0 ? _a : 'Send failed'));
                                    return;
                                }
                                if (ack.message) {
                                    void (0, messages_db_ts_1.updateMessageStatus)(item.local_id, {
                                        server_id: ack.message.id,
                                        sync_status: 'sent',
                                        server_created_at: ack.message.createdAt,
                                    }).then(function () {
                                        onMessageSynced === null || onMessageSynced === void 0 ? void 0 : onMessageSynced(item.local_id, ack.message.id);
                                    });
                                    void (0, outbox_db_ts_1.removeFromOutbox)(item.local_id);
                                }
                                resolve();
                            });
                        })];
                case 8:
                    _d.sent();
                    return [3 /*break*/, 14];
                case 9:
                    _b = _d.sent();
                    return [4 /*yield*/, (0, outbox_db_ts_1.incrementAttempt)(item.local_id)];
                case 10:
                    _d.sent();
                    if (!(item.attempts + 1 >= MAX_ATTEMPTS)) return [3 /*break*/, 13];
                    return [4 /*yield*/, (0, outbox_db_ts_1.markOutboxFailed)(item.local_id)];
                case 11:
                    _d.sent();
                    return [4 /*yield*/, (0, messages_db_ts_1.updateMessageStatus)(item.local_id, { sync_status: 'failed' })];
                case 12:
                    _d.sent();
                    _d.label = 13;
                case 13: return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    });
}
function retry(localId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, outbox_db_ts_1.requeueItem)(localId)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, messages_db_ts_1.updateMessageStatus)(localId, { sync_status: 'pending' })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, flush()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function discard(localId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, outbox_db_ts_1.removeFromOutbox)(localId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
