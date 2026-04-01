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
exports.contactsRouter = void 0;
var express_1 = require("express");
var auth_1 = require("../../shared/middleware/auth");
var error_handler_1 = require("../../shared/middleware/error-handler");
var chat_socket_1 = require("../chat/chat.socket");
var contacts_service_1 = require("./contacts.service");
var db_1 = require("../../shared/db");
var schema_1 = require("../../shared/db/schema");
var drizzle_orm_1 = require("drizzle-orm");
var router = (0, express_1.Router)();
exports.contactsRouter = router;
// All contacts routes require auth
router.use(auth_1.authenticate);
router.post('/request/:userId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var contact, requester, _a, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                return [4 /*yield*/, (0, contacts_service_1.sendRequest)(req.user.userId, req.params.userId)];
            case 1:
                contact = _b.sent();
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 5]);
                return [4 /*yield*/, db_1.db
                        .select({
                        id: schema_1.users.id,
                        username: schema_1.users.username,
                        displayName: schema_1.users.displayName,
                        avatarUrl: schema_1.users.avatarUrl,
                        avatarColor: schema_1.users.avatarColor,
                    })
                        .from(schema_1.users)
                        .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.user.userId))
                        .limit(1)];
            case 3:
                requester = (_b.sent())[0];
                (0, chat_socket_1.getIo)()
                    .to("user:".concat(req.params.userId))
                    .emit('contact:request', { from: requester, contactId: contact.id });
                return [3 /*break*/, 5];
            case 4:
                _a = _b.sent();
                return [3 /*break*/, 5];
            case 5:
                res.status(201).json(contact);
                return [3 /*break*/, 7];
            case 6:
                err_1 = _b.sent();
                next(err_1);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
router.post('/accept/:contactId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var contact, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, contacts_service_1.acceptRequest)(req.params.contactId, req.user.userId)];
            case 1:
                contact = _a.sent();
                res.json(contact);
                return [3 /*break*/, 3];
            case 2:
                err_2 = _a.sent();
                next(err_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post('/reject/:contactId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, contacts_service_1.rejectRequest)(req.params.contactId, req.user.userId)];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                err_3 = _a.sent();
                next(err_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post('/block/:userId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var contact, err_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, contacts_service_1.blockUser)(req.user.userId, req.params.userId)];
            case 1:
                contact = _a.sent();
                res.json(contact);
                return [3 /*break*/, 3];
            case 2:
                err_4 = _a.sent();
                next(err_4);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Must be before /:contactId to avoid param capture
router.get('/block-status/:userId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var status_1, err_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, contacts_service_1.getBlockStatus)(req.user.userId, req.params.userId)];
            case 1:
                status_1 = _a.sent();
                res.json(status_1);
                return [3 /*break*/, 3];
            case 2:
                err_5 = _a.sent();
                next(err_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get('/blocked', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var blocked, err_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, contacts_service_1.getBlockedUsers)(req.user.userId)];
            case 1:
                blocked = _a.sent();
                res.json(blocked);
                return [3 /*break*/, 3];
            case 2:
                err_6 = _a.sent();
                next(err_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.delete('/block/:userId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, contacts_service_1.unblockUser)(req.user.userId, req.params.userId)];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                err_7 = _a.sent();
                next(err_7);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get('/', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var contacts, err_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, contacts_service_1.getContacts)(req.user.userId)];
            case 1:
                contacts = _a.sent();
                res.json(contacts);
                return [3 /*break*/, 3];
            case 2:
                err_8 = _a.sent();
                next(err_8);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get('/pending', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var requests, err_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, contacts_service_1.getPendingRequests)(req.user.userId)];
            case 1:
                requests = _a.sent();
                res.json(requests);
                return [3 /*break*/, 3];
            case 2:
                err_9 = _a.sent();
                next(err_9);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get('/search', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var q, users_1, err_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                q = req.query.q;
                if (!q || q.length < 2) {
                    throw new error_handler_1.AppError(400, 'Search query must be at least 2 characters');
                }
                return [4 /*yield*/, (0, contacts_service_1.searchUsers)(q, req.user.userId)];
            case 1:
                users_1 = _a.sent();
                res.json(users_1);
                return [3 /*break*/, 3];
            case 2:
                err_10 = _a.sent();
                next(err_10);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.put('/:contactId/nickname', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var nickname, contact, err_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                nickname = req.body.nickname;
                return [4 /*yield*/, (0, contacts_service_1.setNickname)(req.params.contactId, req.user.userId, nickname || null)];
            case 1:
                contact = _a.sent();
                res.json(contact);
                return [3 /*break*/, 3];
            case 2:
                err_11 = _a.sent();
                next(err_11);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.put('/:contactId/mute', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var contact, err_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, contacts_service_1.toggleMute)(req.params.contactId, req.user.userId)];
            case 1:
                contact = _a.sent();
                res.json(contact);
                return [3 /*break*/, 3];
            case 2:
                err_12 = _a.sent();
                next(err_12);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.put('/:contactId/myNickname', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var myNickname, contact, err_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                myNickname = req.body.myNickname;
                return [4 /*yield*/, (0, contacts_service_1.setMyNickname)(req.params.contactId, req.user.userId, myNickname || null)];
            case 1:
                contact = _a.sent();
                res.json(contact);
                return [3 /*break*/, 3];
            case 2:
                err_13 = _a.sent();
                next(err_13);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.put('/:contactId/relationship', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var relationshipType, contact, err_14;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                relationshipType = req.body.relationshipType;
                return [4 /*yield*/, (0, contacts_service_1.setRelationshipType)(req.params.contactId, req.user.userId, relationshipType)];
            case 1:
                contact = _a.sent();
                res.json(contact);
                return [3 /*break*/, 3];
            case 2:
                err_14 = _a.sent();
                next(err_14);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.delete('/:contactId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_15;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, contacts_service_1.removeContact)(req.params.contactId, req.user.userId)];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                err_15 = _a.sent();
                next(err_15);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
