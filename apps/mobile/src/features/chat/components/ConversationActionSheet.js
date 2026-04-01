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
exports.ConversationActionSheet = ConversationActionSheet;
var react_1 = require("react");
var react_native_1 = require("react-native");
var api_1 = require("../../../shared/services/api");
var Toast_1 = require("../../../shared/components/Toast");
var conversations_1 = require("../../../shared/stores/conversations");
var conversations_db_ts_1 = require("../../../shared/db/conversations.db.ts");
var useThemeColors_1 = require("../../../shared/hooks/useThemeColors");
function ConversationActionSheet(_a) {
    var visible = _a.visible, conversation = _a.conversation, contactId = _a.contactId, isMuted = _a.isMuted, onClose = _a.onClose;
    var _b = (0, react_1.useState)(false), loading = _b[0], setLoading = _b[1];
    var showToast = (0, Toast_1.useToast)().showToast;
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = makeStyles(colors);
    if (!conversation)
        return null;
    var conv = conversation; // narrowed non-null for closures
    function hideConversation(id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                conversations_1.useConversationsStore.getState().addHiddenConversation(id);
                void (0, conversations_db_ts_1.hideCachedConversation)(id);
                return [2 /*return*/];
            });
        });
    }
    function handleMuteToggle() {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!contactId)
                            return [2 /*return*/];
                        setLoading(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, api_1.contactsApi.toggleMute(contactId)];
                    case 2:
                        _b.sent();
                        showToast('success', isMuted ? 'Notifications unmuted' : 'Notifications muted');
                        return [3 /*break*/, 5];
                    case 3:
                        _a = _b.sent();
                        showToast('error', 'Failed to update mute');
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        onClose();
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleDeleteForMe() {
        var _this = this;
        react_native_1.Alert.alert('Delete conversation', 'This will delete the conversation only for you.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                onClose();
                                setLoading(true);
                                _b.label = 1;
                            case 1:
                                _b.trys.push([1, 4, 5, 6]);
                                return [4 /*yield*/, api_1.chatApi.deleteConversation(conv.id, 'me')];
                            case 2:
                                _b.sent();
                                return [4 /*yield*/, hideConversation(conv.id)];
                            case 3:
                                _b.sent();
                                return [3 /*break*/, 6];
                            case 4:
                                _a = _b.sent();
                                showToast('error', 'Failed to delete conversation');
                                return [3 /*break*/, 6];
                            case 5:
                                setLoading(false);
                                return [7 /*endfinally*/];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); },
            },
        ]);
    }
    function handleDeleteForEveryone() {
        var _this = this;
        react_native_1.Alert.alert('Delete for everyone', 'This will permanently delete the conversation for both you and the other person.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete for everyone',
                style: 'destructive',
                onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                    var err_1;
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                onClose();
                                setLoading(true);
                                _c.label = 1;
                            case 1:
                                _c.trys.push([1, 4, 5, 6]);
                                return [4 /*yield*/, api_1.chatApi.deleteConversation(conv.id, 'everyone')];
                            case 2:
                                _c.sent();
                                return [4 /*yield*/, hideConversation(conv.id)];
                            case 3:
                                _c.sent();
                                return [3 /*break*/, 6];
                            case 4:
                                err_1 = _c.sent();
                                showToast('error', ((_b = (_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to delete conversation');
                                return [3 /*break*/, 6];
                            case 5:
                                setLoading(false);
                                return [7 /*endfinally*/];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); },
            },
        ]);
    }
    function handleBlock() {
        var _this = this;
        react_native_1.Alert.alert("Block ".concat(conv.otherUser.displayName, "?"), 'They will no longer be able to message you or send you requests.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Block',
                style: 'destructive',
                onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                onClose();
                                setLoading(true);
                                _b.label = 1;
                            case 1:
                                _b.trys.push([1, 4, 5, 6]);
                                return [4 /*yield*/, api_1.contactsApi.blockContact(conv.otherUser.id)];
                            case 2:
                                _b.sent();
                                return [4 /*yield*/, hideConversation(conv.id)];
                            case 3:
                                _b.sent();
                                showToast('success', 'User blocked');
                                return [3 /*break*/, 6];
                            case 4:
                                _a = _b.sent();
                                showToast('error', 'Failed to block user');
                                return [3 /*break*/, 6];
                            case 5:
                                setLoading(false);
                                return [7 /*endfinally*/];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); },
            },
        ]);
    }
    return (<react_native_1.Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <react_native_1.TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}/>
            <react_native_1.View style={[styles.sheet, { backgroundColor: colors.bg }]}>
                <react_native_1.View style={styles.handle}/>

                <react_native_1.Text style={[styles.title, { color: colors.dark }]} numberOfLines={1}>
                    {conv.otherUser.displayName}
                </react_native_1.Text>

                {loading && (<react_native_1.ActivityIndicator style={{ marginBottom: 12 }} color={colors.primary}/>)}

                <react_native_1.TouchableOpacity style={styles.row} onPress={handleMuteToggle} disabled={!contactId || loading}>
                    <react_native_1.Text style={[styles.rowText, { color: colors.dark }]}>
                        {isMuted ? 'Unmute notifications' : 'Mute notifications'}
                    </react_native_1.Text>
                </react_native_1.TouchableOpacity>

                <react_native_1.TouchableOpacity style={styles.row} onPress={handleDeleteForMe} disabled={loading}>
                    <react_native_1.Text style={[styles.rowText, { color: colors.dark }]}>Delete for me</react_native_1.Text>
                </react_native_1.TouchableOpacity>

                <react_native_1.TouchableOpacity style={styles.row} onPress={handleDeleteForEveryone} disabled={loading}>
                    <react_native_1.Text style={[styles.rowText, styles.destructive]}>Delete for everyone</react_native_1.Text>
                </react_native_1.TouchableOpacity>

                <react_native_1.TouchableOpacity style={styles.row} onPress={handleBlock} disabled={loading}>
                    <react_native_1.Text style={[styles.rowText, styles.destructive]}>Block user</react_native_1.Text>
                </react_native_1.TouchableOpacity>

                <react_native_1.TouchableOpacity style={[styles.row, styles.cancelRow]} onPress={onClose}>
                    <react_native_1.Text style={[styles.rowText, { color: colors.primary, fontWeight: '600' }]}>
                        Cancel
                    </react_native_1.Text>
                </react_native_1.TouchableOpacity>
            </react_native_1.View>
        </react_native_1.Modal>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
        },
        sheet: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 32,
            paddingTop: 8,
        },
        handle: {
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.gray300,
            alignSelf: 'center',
            marginBottom: 12,
        },
        title: {
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
            paddingHorizontal: 20,
            paddingBottom: 12,
            borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        row: {
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        rowText: {
            fontSize: 16,
            textAlign: 'center',
        },
        destructive: {
            color: '#F44336',
        },
        cancelRow: {
            marginTop: 8,
            borderBottomWidth: 0,
        },
    });
}
