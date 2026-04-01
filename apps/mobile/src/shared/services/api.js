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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatApi = exports.contactsApi = exports.BASE_URL = exports.api = void 0;
var expo_constants_1 = __importDefault(require("expo-constants"));
var axios_1 = __importDefault(require("axios"));
var react_native_1 = require("react-native");
var auth_1 = require("../stores/auth");
var DEFAULT_PORT = '5000';
function normalizeBaseUrl(value) {
    return value.replace(/\/$/, '').replace(/\/api$/, '');
}
function getExpoHostUrl() {
    var _a;
    var hostUri = (_a = expo_constants_1.default.expoConfig) === null || _a === void 0 ? void 0 : _a.hostUri;
    if (!hostUri) {
        return null;
    }
    var hostname = hostUri.split(':')[0];
    if (!hostname) {
        return null;
    }
    return "http://".concat(hostname, ":").concat(DEFAULT_PORT);
}
function getLocalhostUrl() {
    return react_native_1.Platform.OS === 'android'
        ? "http://10.0.2.2:".concat(DEFAULT_PORT)
        : "http://127.0.0.1:".concat(DEFAULT_PORT);
}
function resolveBaseUrl() {
    var _a;
    var envUrl = (_a = process.env.EXPO_PUBLIC_API_URL) === null || _a === void 0 ? void 0 : _a.trim();
    if (envUrl) {
        return normalizeBaseUrl(envUrl);
    }
    var expoHostUrl = getExpoHostUrl();
    if (expoHostUrl) {
        return expoHostUrl;
    }
    return getLocalhostUrl();
}
var BASE_URL = resolveBaseUrl();
exports.BASE_URL = BASE_URL;
exports.api = axios_1.default.create({
    baseURL: "".concat(BASE_URL, "/api"),
    headers: { 'Content-Type': 'application/json' },
});
// Attach access token to every request
exports.api.interceptors.request.use(function (config) {
    var token = auth_1.useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = "Bearer ".concat(token);
    }
    return config;
});
// Auto-refresh token on 401
exports.api.interceptors.response.use(function (response) { return response; }, function (error) { return __awaiter(void 0, void 0, void 0, function () {
    var originalRequest, refreshToken, data, _a;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                originalRequest = error.config;
                if (!(((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 401 && !originalRequest._retry)) return [3 /*break*/, 4];
                originalRequest._retry = true;
                refreshToken = auth_1.useAuthStore.getState().refreshToken;
                if (!refreshToken) {
                    auth_1.useAuthStore.getState().logout();
                    return [2 /*return*/, Promise.reject(error)];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, axios_1.default.post("".concat(BASE_URL, "/api/auth/refresh"), {
                        refreshToken: refreshToken,
                    })];
            case 2:
                data = (_c.sent()).data;
                auth_1.useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
                originalRequest.headers.Authorization = "Bearer ".concat(data.accessToken);
                return [2 /*return*/, (0, exports.api)(originalRequest)];
            case 3:
                _a = _c.sent();
                auth_1.useAuthStore.getState().logout();
                return [2 /*return*/, Promise.reject(error)];
            case 4: return [2 /*return*/, Promise.reject(error)];
        }
    });
}); });
// Contacts API
exports.contactsApi = {
    getContacts: function () { return exports.api.get('/contacts'); },
    getPending: function () { return exports.api.get('/contacts/pending'); },
    search: function (query) { return exports.api.get("/contacts/search?q=".concat(query)); },
    sendRequest: function (userId) { return exports.api.post("/contacts/request/".concat(userId)); },
    accept: function (contactId) { return exports.api.post("/contacts/accept/".concat(contactId)); },
    reject: function (contactId) { return exports.api.post("/contacts/reject/".concat(contactId)); },
    setNickname: function (contactId, nickname) {
        return exports.api.put("/contacts/".concat(contactId, "/nickname"), { nickname: nickname });
    },
    setMyNickname: function (contactId, myNickname) {
        return exports.api.put("/contacts/".concat(contactId, "/myNickname"), { myNickname: myNickname });
    },
    setRelationshipType: function (contactId, relationshipType) {
        return exports.api.put("/contacts/".concat(contactId, "/relationship"), { relationshipType: relationshipType });
    },
    removeContact: function (contactId) { return exports.api.delete("/contacts/".concat(contactId)); },
    blockContact: function (userId) { return exports.api.post("/contacts/block/".concat(userId)); },
    toggleMute: function (contactId) { return exports.api.put("/contacts/".concat(contactId, "/mute")); },
    getBlockedUsers: function () { return exports.api.get('/contacts/blocked'); },
    unblockUser: function (userId) { return exports.api.delete("/contacts/block/".concat(userId)); },
    getBlockStatus: function (userId) {
        return exports.api.get("/contacts/block-status/".concat(userId));
    },
};
// Chat API
exports.chatApi = {
    getConversations: function () { return exports.api.get('/chat/conversations'); },
    getOrCreateConversation: function (userId) { return exports.api.post("/chat/conversations/".concat(userId)); },
    getMessages: function (conversationId, limit, offset) {
        if (limit === void 0) { limit = 50; }
        if (offset === void 0) { offset = 0; }
        return exports.api.get("/chat/conversations/".concat(conversationId, "/messages?limit=").concat(limit, "&offset=").concat(offset));
    },
    sendMessage: function (conversationId, content, type) {
        if (type === void 0) { type = 'text'; }
        return exports.api.post("/chat/conversations/".concat(conversationId, "/messages"), { content: content, type: type });
    },
    deleteConversation: function (conversationId, scope) {
        return exports.api.delete("/chat/conversations/".concat(conversationId), { params: { scope: scope } });
    },
};
