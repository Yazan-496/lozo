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
exports.ForwardModal = ForwardModal;
var react_1 = require("react");
var react_native_1 = require("react-native");
var Avatar_1 = require("../../../shared/components/Avatar");
var ConversationSkeleton_1 = require("../../../shared/components/ConversationSkeleton");
var api_1 = require("../../../shared/services/api");
var theme_1 = require("../../../shared/utils/theme");
function ForwardModal(_a) {
    var visible = _a.visible, message = _a.message, onClose = _a.onClose, onForward = _a.onForward, excludeConversationId = _a.excludeConversationId;
    var _b = (0, react_1.useState)([]), conversations = _b[0], setConversations = _b[1];
    var _c = (0, react_1.useState)(false), loading = _c[0], setLoading = _c[1];
    (0, react_1.useEffect)(function () {
        if (visible) {
            loadConversations();
        }
    }, [visible]);
    function loadConversations() {
        return __awaiter(this, void 0, void 0, function () {
            var data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, api_1.api.get('/chat/conversations')];
                    case 2:
                        data = (_a.sent()).data;
                        setConversations(data);
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        console.error('Failed to load conversations:', err_1);
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function renderConversation(_a) {
        var item = _a.item;
        var lastMessagePreview = item.lastMessage
            ? item.lastMessage.deletedForEveryone
                ? 'Message deleted'
                : item.lastMessage.content || '[Message]'
            : 'No messages yet';
        var isCurrent = item.id === excludeConversationId;
        return (<react_native_1.TouchableOpacity style={[styles.conversationRow, isCurrent && { opacity: 0.4 }]} onPress={function () { return !isCurrent && onForward(item.id); }} disabled={isCurrent}>
        <Avatar_1.Avatar uri={item.otherUser.avatarUrl} name={item.otherUser.displayName} color={item.otherUser.avatarColor} size={44} isOnline={false}/>
        <react_native_1.View style={styles.conversationInfo}>
          <react_native_1.Text style={styles.displayName} numberOfLines={1}>
            {item.otherUser.displayName}
            {isCurrent ? ' (current)' : ''}
          </react_native_1.Text>
          <react_native_1.Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessagePreview}
          </react_native_1.Text>
        </react_native_1.View>
      </react_native_1.TouchableOpacity>);
    }
    return (<react_native_1.Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <react_native_1.View style={styles.container}>
        {/* Header */}
        <react_native_1.View style={styles.header}>
          <react_native_1.Text style={styles.headerTitle}>Forward to</react_native_1.Text>
          <react_native_1.TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <react_native_1.Text style={styles.closeIcon}>×</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        {/* Body */}
        {loading ? (<ConversationSkeleton_1.ConversationSkeleton />) : (<react_native_1.FlatList data={conversations} keyExtractor={function (item) { return item.id; }} renderItem={renderConversation} contentContainerStyle={styles.listContent}/>)}
      </react_native_1.View>
    </react_native_1.Modal>);
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.lightColors.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme_1.lightColors.gray100,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme_1.lightColors.dark,
    },
    closeButton: {
        padding: 4,
    },
    closeIcon: {
        fontSize: 28,
        color: theme_1.lightColors.gray400,
    },
    listContent: {
        paddingVertical: 8,
    },
    conversationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    conversationInfo: {
        flex: 1,
        marginLeft: 12,
    },
    displayName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme_1.lightColors.dark,
        marginBottom: 4,
    },
    lastMessage: {
        fontSize: 14,
        color: theme_1.lightColors.gray500,
    },
});
