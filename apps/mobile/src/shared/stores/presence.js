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
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePresenceStore = void 0;
var zustand_1 = require("zustand");
exports.usePresenceStore = (0, zustand_1.create)(function (set) { return ({
    onlineUserIds: new Set(),
    lastSeenMap: {},
    setOnline: function (userId) {
        return set(function (s) { return ({ onlineUserIds: new Set(s.onlineUserIds).add(userId) }); });
    },
    setOffline: function (userId, lastSeenAt) {
        return set(function (s) {
            var _a;
            var next = new Set(s.onlineUserIds);
            next.delete(userId);
            return { onlineUserIds: next, lastSeenMap: __assign(__assign({}, s.lastSeenMap), (_a = {}, _a[userId] = lastSeenAt, _a)) };
        });
    },
    seedOnline: function (userIds) {
        return set({ onlineUserIds: new Set(userIds) });
    },
}); });
