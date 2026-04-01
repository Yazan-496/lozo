"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNetworkStore = void 0;
var zustand_1 = require("zustand");
exports.useNetworkStore = (0, zustand_1.create)(function (set) { return ({
    isOnline: true, // optimistic default; corrected in App.tsx on mount
    setOnline: function (v) { return set({ isOnline: v }); },
}); });
