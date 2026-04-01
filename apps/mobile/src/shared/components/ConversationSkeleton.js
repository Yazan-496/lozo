"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationSkeleton = ConversationSkeleton;
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var Shimmer_1 = require("./Shimmer");
var theme_1 = require("../utils/theme");
function ConversationSkeleton() {
    var rows = Array(6).fill(0);
    return (<Shimmer_1.Shimmer>
      <react_native_1.View style={styles.container}>
        {rows.map(function (_, idx) { return (<react_native_1.View key={idx} style={styles.row}>
            <react_native_1.View style={styles.avatar}/>
            <react_native_1.View style={styles.textContainer}>
              <react_native_1.View style={[styles.text, styles.textLarge]}/>
              <react_native_1.View style={[styles.text, styles.textSmall]}/>
            </react_native_1.View>
          </react_native_1.View>); })}
      </react_native_1.View>
    </Shimmer_1.Shimmer>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme_1.lightColors.gray200,
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    text: {
        height: 12,
        backgroundColor: theme_1.lightColors.gray200,
        borderRadius: 6,
        marginBottom: 6,
    },
    textLarge: {
        width: '60%',
    },
    textSmall: {
        width: '40%',
    },
});
