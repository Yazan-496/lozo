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
exports.enqueueOutbox = enqueueOutbox;
exports.getQueuedItems = getQueuedItems;
exports.incrementAttempt = incrementAttempt;
exports.markOutboxFailed = markOutboxFailed;
exports.removeFromOutbox = removeFromOutbox;
exports.requeueItem = requeueItem;
var sqlite_1 = require("./sqlite");
function enqueueOutbox(localId, conversationId, payload) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    return [4 /*yield*/, db.runAsync("INSERT INTO outbox (local_id, conversation_id, payload, attempts, status, created_at)\n     VALUES (?, ?, ?, 0, 'queued', ?)", [localId, conversationId, JSON.stringify(payload), new Date().toISOString()])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getQueuedItems() {
    return __awaiter(this, void 0, void 0, function () {
        var db, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    return [4 /*yield*/, db.getAllAsync("SELECT * FROM outbox WHERE status = 'queued' ORDER BY created_at ASC")];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows.map(function (row) { return (__assign(__assign({}, row), { payload: row.payload })); })];
            }
        });
    });
}
function incrementAttempt(localId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    return [4 /*yield*/, db.runAsync("UPDATE outbox SET attempts = attempts + 1, last_attempt_at = ? WHERE local_id = ?", [new Date().toISOString(), localId])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function markOutboxFailed(localId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    return [4 /*yield*/, db.runAsync("UPDATE outbox SET status = 'failed' WHERE local_id = ?", [localId])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function removeFromOutbox(localId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    return [4 /*yield*/, db.runAsync("DELETE FROM outbox WHERE local_id = ?", [localId])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function requeueItem(localId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = (0, sqlite_1.getDb)();
                    return [4 /*yield*/, db.runAsync("UPDATE outbox SET attempts = 0, status = 'queued', last_attempt_at = NULL WHERE local_id = ?", [localId])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
