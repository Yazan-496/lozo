"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSkeleton = MessageSkeleton;
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var Shimmer_1 = require("./Shimmer");
var theme_1 = require("../utils/theme");
function MessageSkeleton() {
    var messages = [
        { side: 'left', width: '70%' },
        { side: 'right', width: '60%' },
        { side: 'left', width: '80%' },
        { side: 'right', width: '65%' },
        { side: 'left', width: '75%' },
    ];
    return (<Shimmer_1.Shimmer>
      <react_native_1.View style={styles.container}>
        {messages.map(function (msg, idx) { return (<react_native_1.View key={idx} style={[
                styles.messageBubble,
                msg.side === 'right' ? styles.rightBubble : styles.leftBubble,
            ]}>
            <react_native_1.View style={[
                styles.skeletonBox,
                { width: msg.width },
            ]}/>
          </react_native_1.View>); })}
      </react_native_1.View>
    </Shimmer_1.Shimmer>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    messageBubble: {
        marginVertical: 8,
    },
    leftBubble: {
        alignItems: 'flex-start',
    },
    rightBubble: {
        alignItems: 'flex-end',
    },
    skeletonBox: {
        height: 44,
        backgroundColor: theme_1.lightColors.gray200,
        borderRadius: 18,
    },
});
