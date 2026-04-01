"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPresenceString = getPresenceString;
function getPresenceString(isOnline, lastSeenAt) {
    if (isOnline)
        return 'Active now';
    var diff = Date.now() - new Date(lastSeenAt).getTime();
    var minutes = Math.floor(diff / 60000);
    if (minutes < 1)
        return 'Active now';
    if (minutes < 60)
        return "Active ".concat(minutes, "m ago");
    var hours = Math.floor(diff / 3600000);
    if (hours < 24)
        return "Active ".concat(hours, "h ago");
    var days = Math.floor(diff / 86400000);
    return "Active ".concat(days, "d ago");
}
