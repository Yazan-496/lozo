"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useConversationsStore = void 0;
var zustand_1 = require("zustand");
exports.useConversationsStore = (0, zustand_1.create)(function (set) { return ({
    hiddenConversationIds: new Set(),
    addHiddenConversation: function (conversationId) {
        return set(function (state) { return ({
            hiddenConversationIds: new Set(__spreadArray(__spreadArray([], state.hiddenConversationIds, true), [conversationId], false)),
        }); });
    },
    removeHiddenConversation: function (conversationId) {
        return set(function (state) {
            var newSet = new Set(state.hiddenConversationIds);
            newSet.delete(conversationId);
            return { hiddenConversationIds: newSet };
        });
    },
    clearHiddenConversations: function () { return set({ hiddenConversationIds: new Set() }); },
}); });
