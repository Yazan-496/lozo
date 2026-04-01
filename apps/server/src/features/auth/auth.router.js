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
exports.authRouter = void 0;
var express_1 = require("express");
var auth_service_1 = require("./auth.service");
var auth_1 = require("../../shared/middleware/auth");
var error_handler_1 = require("../../shared/middleware/error-handler");
var router = (0, express_1.Router)();
exports.authRouter = router;
router.post('/register', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, displayName, result, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, username = _a.username, password = _a.password, displayName = _a.displayName;
                if (!username || !password || !displayName) {
                    throw new error_handler_1.AppError(400, 'username, password, and displayName are required');
                }
                if (username.length < 3 || username.length > 50) {
                    throw new error_handler_1.AppError(400, 'Username must be 3-50 characters');
                }
                if (password.length < 6) {
                    throw new error_handler_1.AppError(400, 'Password must be at least 6 characters');
                }
                return [4 /*yield*/, (0, auth_service_1.register)(username, password, displayName)];
            case 1:
                result = _b.sent();
                res.status(201).json(result);
                return [3 /*break*/, 3];
            case 2:
                err_1 = _b.sent();
                next(err_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post('/login', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, result, err_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, username = _a.username, password = _a.password;
                if (!username || !password) {
                    throw new error_handler_1.AppError(400, 'username and password are required');
                }
                return [4 /*yield*/, (0, auth_service_1.login)(username, password)];
            case 1:
                result = _b.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                err_2 = _b.sent();
                next(err_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post('/refresh', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var refreshToken, tokens, err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                refreshToken = req.body.refreshToken;
                if (!refreshToken) {
                    throw new error_handler_1.AppError(400, 'refreshToken is required');
                }
                return [4 /*yield*/, (0, auth_service_1.refresh)(refreshToken)];
            case 1:
                tokens = _a.sent();
                res.json(tokens);
                return [3 /*break*/, 3];
            case 2:
                err_3 = _a.sent();
                next(err_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get('/me', auth_1.authenticate, function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, err_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, auth_service_1.getMe)(req.user.userId)];
            case 1:
                user = _a.sent();
                res.json(user);
                return [3 /*break*/, 3];
            case 2:
                err_4 = _a.sent();
                next(err_4);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.put('/profile', auth_1.authenticate, function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, displayName, bio, avatarUrl, avatarColor, user, err_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, displayName = _a.displayName, bio = _a.bio, avatarUrl = _a.avatarUrl, avatarColor = _a.avatarColor;
                return [4 /*yield*/, (0, auth_service_1.updateProfile)(req.user.userId, { displayName: displayName, bio: bio, avatarUrl: avatarUrl, avatarColor: avatarColor })];
            case 1:
                user = _b.sent();
                res.json(user);
                return [3 /*break*/, 3];
            case 2:
                err_5 = _b.sent();
                next(err_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.put('/password', auth_1.authenticate, function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, currentPassword, newPassword, result, err_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, currentPassword = _a.currentPassword, newPassword = _a.newPassword;
                if (!currentPassword || !newPassword) {
                    throw new error_handler_1.AppError(400, 'currentPassword and newPassword are required');
                }
                if (newPassword.length < 6) {
                    throw new error_handler_1.AppError(400, 'New password must be at least 6 characters');
                }
                return [4 /*yield*/, (0, auth_service_1.changePassword)(req.user.userId, currentPassword, newPassword)];
            case 1:
                result = _b.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                err_6 = _b.sent();
                next(err_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
