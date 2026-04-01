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
exports.sendRequest = sendRequest;
exports.acceptRequest = acceptRequest;
exports.rejectRequest = rejectRequest;
exports.blockUser = blockUser;
exports.getContacts = getContacts;
exports.getPendingRequests = getPendingRequests;
exports.searchUsers = searchUsers;
exports.setNickname = setNickname;
exports.toggleMute = toggleMute;
exports.setMyNickname = setMyNickname;
exports.setRelationshipType = setRelationshipType;
exports.getBlockedUsers = getBlockedUsers;
exports.getBlockStatus = getBlockStatus;
exports.unblockUser = unblockUser;
exports.removeContact = removeContact;
var drizzle_orm_1 = require("drizzle-orm");
var db_1 = require("../../shared/db");
var schema_1 = require("../../shared/db/schema");
var error_handler_1 = require("../../shared/middleware/error-handler");
var publicUserFields = {
    id: schema_1.users.id,
    username: schema_1.users.username,
    displayName: schema_1.users.displayName,
    avatarUrl: schema_1.users.avatarUrl,
    avatarColor: schema_1.users.avatarColor,
    bio: schema_1.users.bio,
    isOnline: schema_1.users.isOnline,
    lastSeenAt: schema_1.users.lastSeenAt,
};
function sendRequest(requesterId, addresseeId) {
    return __awaiter(this, void 0, void 0, function () {
        var addressee, block, existing, rel, contact;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (requesterId === addresseeId) {
                        throw new error_handler_1.AppError(400, 'Cannot send request to yourself');
                    }
                    return [4 /*yield*/, db_1.db
                            .select({ id: schema_1.users.id })
                            .from(schema_1.users)
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, addresseeId))
                            .limit(1)];
                case 1:
                    addressee = (_a.sent())[0];
                    if (!addressee) {
                        throw new error_handler_1.AppError(404, 'User not found');
                    }
                    return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.blockedUsers)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockerId, addresseeId), (0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockedId, requesterId)))
                            .limit(1)];
                case 2:
                    block = _a.sent();
                    if (block.length > 0) {
                        throw new error_handler_1.AppError(403, 'Cannot send request to this user');
                    }
                    return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.contacts)
                            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contacts.requesterId, requesterId), (0, drizzle_orm_1.eq)(schema_1.contacts.addresseeId, addresseeId)), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contacts.requesterId, addresseeId), (0, drizzle_orm_1.eq)(schema_1.contacts.addresseeId, requesterId))))
                            .limit(1)];
                case 3:
                    existing = _a.sent();
                    if (existing.length > 0) {
                        rel = existing[0];
                        if (rel.status === 'blocked') {
                            throw new error_handler_1.AppError(403, 'Cannot send request to this user');
                        }
                        if (rel.status === 'accepted') {
                            throw new error_handler_1.AppError(409, 'Already connected');
                        }
                        throw new error_handler_1.AppError(409, 'Request already pending');
                    }
                    return [4 /*yield*/, db_1.db
                            .insert(schema_1.contacts)
                            .values({ requesterId: requesterId, addresseeId: addresseeId })
                            .returning()];
                case 4:
                    contact = (_a.sent())[0];
                    return [2 /*return*/, contact];
            }
        });
    });
}
function acceptRequest(contactId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var contact, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.contacts)
                        .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))
                        .limit(1)];
                case 1:
                    contact = (_a.sent())[0];
                    if (!contact) {
                        throw new error_handler_1.AppError(404, 'Request not found');
                    }
                    if (contact.addresseeId !== userId) {
                        throw new error_handler_1.AppError(403, 'Only the recipient can accept this request');
                    }
                    if (contact.status !== 'pending') {
                        throw new error_handler_1.AppError(400, "Cannot accept a ".concat(contact.status, " request"));
                    }
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.contacts)
                            .set({ status: 'accepted', updatedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))
                            .returning()];
                case 2:
                    updated = (_a.sent())[0];
                    return [2 /*return*/, updated];
            }
        });
    });
}
function rejectRequest(contactId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var contact;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.contacts)
                        .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))
                        .limit(1)];
                case 1:
                    contact = (_a.sent())[0];
                    if (!contact) {
                        throw new error_handler_1.AppError(404, 'Request not found');
                    }
                    if (contact.addresseeId !== userId && contact.requesterId !== userId) {
                        throw new error_handler_1.AppError(403, 'Not authorized');
                    }
                    if (contact.status !== 'pending') {
                        throw new error_handler_1.AppError(400, "Cannot reject a ".concat(contact.status, " request"));
                    }
                    return [4 /*yield*/, db_1.db.delete(schema_1.contacts).where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    });
}
function blockUser(blockerId, blockedId) {
    return __awaiter(this, void 0, void 0, function () {
        var existing;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (blockerId === blockedId) {
                        throw new error_handler_1.AppError(400, 'Cannot block yourself');
                    }
                    return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.blockedUsers)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockerId, blockerId), (0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockedId, blockedId)))
                            .limit(1)];
                case 1:
                    existing = _a.sent();
                    if (!(existing.length === 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, db_1.db.insert(schema_1.blockedUsers).values({ blockerId: blockerId, blockedId: blockedId })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, { success: true }];
            }
        });
    });
}
function getContacts(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var rows, result;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.contacts)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contacts.status, 'accepted'), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.contacts.requesterId, userId), (0, drizzle_orm_1.eq)(schema_1.contacts.addresseeId, userId))))];
                case 1:
                    rows = _a.sent();
                    return [4 /*yield*/, Promise.all(rows.map(function (row) { return __awaiter(_this, void 0, void 0, function () {
                            var otherUserId, isBlocked, otherUser, isRequester;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        otherUserId = row.requesterId === userId ? row.addresseeId : row.requesterId;
                                        return [4 /*yield*/, db_1.db
                                                .select()
                                                .from(schema_1.blockedUsers)
                                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockerId, userId), (0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockedId, otherUserId)))
                                                .limit(1)];
                                    case 1:
                                        isBlocked = _a.sent();
                                        if (isBlocked.length > 0) {
                                            return [2 /*return*/, null];
                                        }
                                        return [4 /*yield*/, db_1.db
                                                .select(publicUserFields)
                                                .from(schema_1.users)
                                                .where((0, drizzle_orm_1.eq)(schema_1.users.id, otherUserId))
                                                .limit(1)];
                                    case 2:
                                        otherUser = (_a.sent())[0];
                                        isRequester = row.requesterId === userId;
                                        return [2 /*return*/, {
                                                contactId: row.id,
                                                nickname: isRequester ? row.nickname : row.myNickname,
                                                myNickname: isRequester ? row.myNickname : row.nickname,
                                                relationshipType: row.relationshipType,
                                                isMuted: row.isMuted,
                                                user: otherUser,
                                                since: row.updatedAt,
                                            }];
                                }
                            });
                        }); }))];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, result.filter(function (r) { return r !== null; })];
            }
        });
    });
}
function getPendingRequests(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select({
                        contactId: schema_1.contacts.id,
                        from: publicUserFields,
                        createdAt: schema_1.contacts.createdAt,
                    })
                        .from(schema_1.contacts)
                        .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.contacts.requesterId))
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contacts.addresseeId, userId), (0, drizzle_orm_1.eq)(schema_1.contacts.status, 'pending')))];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
function searchUsers(query, currentUserId) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select(publicUserFields)
                        .from(schema_1.users)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.ne)(schema_1.users.id, currentUserId), (0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.users.username, "%".concat(query, "%")), (0, drizzle_orm_1.like)(schema_1.users.displayName, "%".concat(query, "%")))))
                        .limit(20)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
function setNickname(contactId, userId, nickname) {
    return __awaiter(this, void 0, void 0, function () {
        var contact, isRequester, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.contacts)
                        .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))
                        .limit(1)];
                case 1:
                    contact = (_a.sent())[0];
                    if (!contact) {
                        throw new error_handler_1.AppError(404, 'Contact not found');
                    }
                    if (contact.requesterId !== userId && contact.addresseeId !== userId) {
                        throw new error_handler_1.AppError(403, 'Not authorized');
                    }
                    if (contact.status !== 'accepted') {
                        throw new error_handler_1.AppError(400, 'Can only set nickname for accepted contacts');
                    }
                    isRequester = contact.requesterId === userId;
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.contacts)
                            .set(__assign(__assign({}, (isRequester ? { nickname: nickname } : { myNickname: nickname })), { updatedAt: new Date() }))
                            .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))
                            .returning()];
                case 2:
                    updated = (_a.sent())[0];
                    return [2 /*return*/, updated];
            }
        });
    });
}
function toggleMute(contactId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var contact, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.contacts)
                        .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))
                        .limit(1)];
                case 1:
                    contact = (_a.sent())[0];
                    if (!contact) {
                        throw new error_handler_1.AppError(404, 'Contact not found');
                    }
                    if (contact.requesterId !== userId && contact.addresseeId !== userId) {
                        throw new error_handler_1.AppError(403, 'Not authorized');
                    }
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.contacts)
                            .set({ isMuted: !contact.isMuted, updatedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))
                            .returning()];
                case 2:
                    updated = (_a.sent())[0];
                    return [2 /*return*/, updated];
            }
        });
    });
}
function setMyNickname(contactId, userId, myNickname) {
    return __awaiter(this, void 0, void 0, function () {
        var contact, isRequester, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.contacts)
                        .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))
                        .limit(1)];
                case 1:
                    contact = (_a.sent())[0];
                    if (!contact) {
                        throw new error_handler_1.AppError(404, 'Contact not found');
                    }
                    if (contact.requesterId !== userId && contact.addresseeId !== userId) {
                        throw new error_handler_1.AppError(403, 'Not authorized');
                    }
                    if (contact.status !== 'accepted') {
                        throw new error_handler_1.AppError(400, 'Can only set my nickname for accepted contacts');
                    }
                    isRequester = contact.requesterId === userId;
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.contacts)
                            .set(__assign(__assign({}, (isRequester ? { myNickname: myNickname } : { nickname: myNickname })), { updatedAt: new Date() }))
                            .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))
                            .returning()];
                case 2:
                    updated = (_a.sent())[0];
                    return [2 /*return*/, updated];
            }
        });
    });
}
function setRelationshipType(contactId, userId, relationshipType) {
    return __awaiter(this, void 0, void 0, function () {
        var contact, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!['friend', 'lover'].includes(relationshipType)) {
                        throw new error_handler_1.AppError(400, 'relationshipType must be "friend" or "lover"');
                    }
                    return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.contacts)
                            .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))
                            .limit(1)];
                case 1:
                    contact = (_a.sent())[0];
                    if (!contact) {
                        throw new error_handler_1.AppError(404, 'Contact not found');
                    }
                    if (contact.requesterId !== userId && contact.addresseeId !== userId) {
                        throw new error_handler_1.AppError(403, 'Not authorized');
                    }
                    if (contact.status !== 'accepted') {
                        throw new error_handler_1.AppError(400, 'Can only set relationship type for accepted contacts');
                    }
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.contacts)
                            .set({ relationshipType: relationshipType, updatedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))
                            .returning()];
                case 2:
                    updated = (_a.sent())[0];
                    return [2 /*return*/, updated];
            }
        });
    });
}
function getBlockedUsers(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select({
                        id: schema_1.users.id,
                        username: schema_1.users.username,
                        displayName: schema_1.users.displayName,
                        avatarUrl: schema_1.users.avatarUrl,
                        avatarColor: schema_1.users.avatarColor,
                        bio: schema_1.users.bio,
                        isOnline: schema_1.users.isOnline,
                        lastSeenAt: schema_1.users.lastSeenAt,
                    })
                        .from(schema_1.blockedUsers)
                        .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.blockedUsers.blockedId))
                        .where((0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockerId, userId))];
                case 1:
                    rows = _a.sent();
                    return [2 /*return*/, rows];
            }
        });
    });
}
function getBlockStatus(currentUserId, otherUserId) {
    return __awaiter(this, void 0, void 0, function () {
        var iBlocked, theyBlocked;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select({ id: schema_1.blockedUsers.id })
                        .from(schema_1.blockedUsers)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockerId, currentUserId), (0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockedId, otherUserId)))
                        .limit(1)];
                case 1:
                    iBlocked = (_a.sent())[0];
                    return [4 /*yield*/, db_1.db
                            .select({ id: schema_1.blockedUsers.id })
                            .from(schema_1.blockedUsers)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockerId, otherUserId), (0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockedId, currentUserId)))
                            .limit(1)];
                case 2:
                    theyBlocked = (_a.sent())[0];
                    return [2 /*return*/, {
                            iBlockedThem: !!iBlocked,
                            amBlockedByThem: !!theyBlocked,
                        }];
            }
        });
    });
}
function unblockUser(blockerId, blockedId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .delete(schema_1.blockedUsers)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockerId, blockerId), (0, drizzle_orm_1.eq)(schema_1.blockedUsers.blockedId, blockedId)))];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    });
}
function removeContact(contactId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var contact;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.contacts)
                        .where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))
                        .limit(1)];
                case 1:
                    contact = (_a.sent())[0];
                    if (!contact) {
                        throw new error_handler_1.AppError(404, 'Contact not found');
                    }
                    if (contact.requesterId !== userId && contact.addresseeId !== userId) {
                        throw new error_handler_1.AppError(403, 'Not authorized');
                    }
                    if (contact.status !== 'accepted') {
                        throw new error_handler_1.AppError(400, 'Can only remove accepted contacts');
                    }
                    return [4 /*yield*/, db_1.db.delete(schema_1.contacts).where((0, drizzle_orm_1.eq)(schema_1.contacts.id, contactId))];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    });
}
