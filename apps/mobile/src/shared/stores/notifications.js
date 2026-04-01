"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNotificationsStore = void 0;
var zustand_1 = require("zustand");
exports.useNotificationsStore = (0, zustand_1.create)(function (set) { return ({
    pendingRequestsCount: 0,
    totalUnreadMessages: 0,
    setPendingRequestsCount: function (n) { return set({ pendingRequestsCount: n }); },
    setTotalUnreadMessages: function (n) { return set({ totalUnreadMessages: n }); },
}); });
