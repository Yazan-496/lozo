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
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.getMe = getMe;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
var bcrypt_1 = __importDefault(require("bcrypt"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var drizzle_orm_1 = require("drizzle-orm");
var db_1 = require("../../shared/db");
var schema_1 = require("../../shared/db/schema");
var error_handler_1 = require("../../shared/middleware/error-handler");
var SALT_ROUNDS = 10;
var ACCESS_TOKEN_EXPIRY = '15m';
var REFRESH_TOKEN_EXPIRY = '7d';
// Messenger-style avatar colors
var AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F0B27A', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2',
];
function randomAvatarColor() {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
function generateTokens(payload) {
    var accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
    var refreshToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
    });
    return { accessToken: accessToken, refreshToken: refreshToken };
}
// Fields returned to client (never include password)
var publicUserFields = {
    id: schema_1.users.id,
    username: schema_1.users.username,
    displayName: schema_1.users.displayName,
    avatarUrl: schema_1.users.avatarUrl,
    avatarColor: schema_1.users.avatarColor,
    bio: schema_1.users.bio,
    isOnline: schema_1.users.isOnline,
    lastSeenAt: schema_1.users.lastSeenAt,
    createdAt: schema_1.users.createdAt,
};
function register(username, password, displayName) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, hashedPassword, avatarColor, user, tokens;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select({ id: schema_1.users.id })
                        .from(schema_1.users)
                        .where((0, drizzle_orm_1.eq)(schema_1.users.username, username))
                        .limit(1)];
                case 1:
                    existing = _a.sent();
                    if (existing.length > 0) {
                        throw new error_handler_1.AppError(409, 'Username already taken');
                    }
                    return [4 /*yield*/, bcrypt_1.default.hash(password, SALT_ROUNDS)];
                case 2:
                    hashedPassword = _a.sent();
                    avatarColor = randomAvatarColor();
                    return [4 /*yield*/, db_1.db
                            .insert(schema_1.users)
                            .values({ username: username, password: hashedPassword, displayName: displayName, avatarColor: avatarColor })
                            .returning(publicUserFields)];
                case 3:
                    user = (_a.sent())[0];
                    tokens = generateTokens({ userId: user.id, username: user.username });
                    return [2 /*return*/, __assign({ user: user }, tokens)];
            }
        });
    });
}
function login(username, password) {
    return __awaiter(this, void 0, void 0, function () {
        var user, valid, tokens;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.users)
                        .where((0, drizzle_orm_1.eq)(schema_1.users.username, username))
                        .limit(1)];
                case 1:
                    user = (_a.sent())[0];
                    if (!user) {
                        throw new error_handler_1.AppError(401, 'Invalid username or password');
                    }
                    return [4 /*yield*/, bcrypt_1.default.compare(password, user.password)];
                case 2:
                    valid = _a.sent();
                    if (!valid) {
                        throw new error_handler_1.AppError(401, 'Invalid username or password');
                    }
                    tokens = generateTokens({ userId: user.id, username: user.username });
                    return [2 /*return*/, __assign({ user: {
                                id: user.id,
                                username: user.username,
                                displayName: user.displayName,
                                avatarUrl: user.avatarUrl,
                                avatarColor: user.avatarColor,
                                bio: user.bio,
                                isOnline: user.isOnline,
                                lastSeenAt: user.lastSeenAt,
                            } }, tokens)];
            }
        });
    });
}
function refresh(refreshToken) {
    return __awaiter(this, void 0, void 0, function () {
        var payload, tokens;
        return __generator(this, function (_a) {
            try {
                payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                tokens = generateTokens({ userId: payload.userId, username: payload.username });
                return [2 /*return*/, tokens];
            }
            catch (_b) {
                throw new error_handler_1.AppError(401, 'Invalid or expired refresh token');
            }
            return [2 /*return*/];
        });
    });
}
function getMe(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select(publicUserFields)
                        .from(schema_1.users)
                        .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                        .limit(1)];
                case 1:
                    user = (_a.sent())[0];
                    if (!user) {
                        throw new error_handler_1.AppError(404, 'User not found');
                    }
                    return [2 /*return*/, user];
            }
        });
    });
}
function updateProfile(userId, data) {
    return __awaiter(this, void 0, void 0, function () {
        var updateData, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    updateData = { updatedAt: new Date() };
                    if (data.displayName)
                        updateData.displayName = data.displayName;
                    if (data.bio !== undefined)
                        updateData.bio = data.bio;
                    if (data.avatarUrl !== undefined)
                        updateData.avatarUrl = data.avatarUrl;
                    if (data.avatarColor)
                        updateData.avatarColor = data.avatarColor;
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.users)
                            .set(updateData)
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                            .returning(publicUserFields)];
                case 1:
                    user = (_a.sent())[0];
                    if (!user) {
                        throw new error_handler_1.AppError(404, 'User not found');
                    }
                    return [2 /*return*/, user];
            }
        });
    });
}
function changePassword(userId, currentPassword, newPassword) {
    return __awaiter(this, void 0, void 0, function () {
        var user, valid, hashedPassword;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select({ password: schema_1.users.password })
                        .from(schema_1.users)
                        .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                        .limit(1)];
                case 1:
                    user = (_a.sent())[0];
                    if (!user) {
                        throw new error_handler_1.AppError(404, 'User not found');
                    }
                    return [4 /*yield*/, bcrypt_1.default.compare(currentPassword, user.password)];
                case 2:
                    valid = _a.sent();
                    if (!valid) {
                        throw new error_handler_1.AppError(401, 'Current password is incorrect');
                    }
                    return [4 /*yield*/, bcrypt_1.default.hash(newPassword, SALT_ROUNDS)];
                case 3:
                    hashedPassword = _a.sent();
                    return [4 /*yield*/, db_1.db
                            .update(schema_1.users)
                            .set({ password: hashedPassword, updatedAt: new Date() })
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))];
                case 4:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    });
}
