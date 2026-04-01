"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineBanner = OfflineBanner;
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var network_1 = require("../stores/network");
function OfflineBanner() {
    var isOnline = (0, network_1.useNetworkStore)(function (s) { return s.isOnline; });
    if (isOnline)
        return null;
    return (<react_native_1.View style={styles.banner}>
      <react_native_1.Text style={styles.text}>You're offline</react_native_1.Text>
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    banner: {
        backgroundColor: '#888888',
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
});
