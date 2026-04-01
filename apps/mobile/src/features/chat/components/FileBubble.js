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
exports.FileBubble = FileBubble;
var react_native_1 = require("react-native");
var vector_icons_1 = require("@expo/vector-icons");
var useThemeColors_1 = require("../../../shared/hooks/useThemeColors");
var media_1 = require("../../../shared/utils/media");
function FileBubble(_a) {
    var fileName = _a.fileName, fileSize = _a.fileSize, fileUrl = _a.fileUrl, isMe = _a.isMe;
    var colors = (0, useThemeColors_1.useThemeColors)();
    function handlePress() {
        return __awaiter(this, void 0, void 0, function () {
            var supported, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, react_native_1.Linking.canOpenURL(fileUrl)];
                    case 1:
                        supported = _b.sent();
                        if (!supported) return [3 /*break*/, 3];
                        return [4 /*yield*/, react_native_1.Linking.openURL(fileUrl)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        react_native_1.Alert.alert('Cannot open file', 'No app available to open this file.');
                        _b.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        _a = _b.sent();
                        react_native_1.Alert.alert('Error', 'Could not open the file.');
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    return (<react_native_1.TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
            <vector_icons_1.Ionicons name="document-outline" size={28} color={isMe ? 'rgba(255,255,255,0.9)' : colors.primary}/>
            <react_native_1.View style={styles.textContainer}>
                <react_native_1.Text style={[styles.fileName, { color: isMe ? '#FFFFFF' : colors.dark }]} numberOfLines={1}>
                    {fileName}
                </react_native_1.Text>
                <react_native_1.Text style={[styles.fileSize, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.gray500 }]}>
                    {(0, media_1.formatFileSize)(fileSize)}
                </react_native_1.Text>
            </react_native_1.View>
        </react_native_1.TouchableOpacity>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
        minWidth: 180,
        maxWidth: 240,
    },
    textContainer: { flex: 1 },
    fileName: { fontSize: 14, fontWeight: '500' },
    fileSize: { fontSize: 12, marginTop: 2 },
});
