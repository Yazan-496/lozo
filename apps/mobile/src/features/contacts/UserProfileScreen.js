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
exports.UserProfileScreen = UserProfileScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var Avatar_1 = require("../../shared/components/Avatar");
var Toast_1 = require("../../shared/components/Toast");
var api_1 = require("../../shared/services/api");
var useThemeColors_1 = require("../../shared/hooks/useThemeColors");
function UserProfileScreen(_a) {
    var navigation = _a.navigation, route = _a.route;
    var user = route.params.user;
    var _b = (0, react_1.useState)('loading'), status = _b[0], setStatus = _b[1];
    var _c = (0, react_1.useState)(false), showLoverModal = _c[0], setShowLoverModal = _c[1];
    var _d = (0, react_1.useState)(false), saving = _d[0], setSaving = _d[1];
    var showToast = (0, Toast_1.useToast)().showToast;
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    (0, react_1.useEffect)(function () {
        checkStatus();
    }, []);
    function checkStatus() {
        return __awaiter(this, void 0, void 0, function () {
            var data, sent, received, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setStatus('loading');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, api_1.contactsApi.getPending()];
                    case 2:
                        data = (_b.sent()).data;
                        sent = data.find(function (r) { var _a; return ((_a = r.to) === null || _a === void 0 ? void 0 : _a.id) === user.id || r.addresseeId === user.id; });
                        received = data.find(function (r) { return r.from.id === user.id; });
                        if (received) {
                            setStatus('pending_received');
                            return [2 /*return*/];
                        }
                        if (sent) {
                            setStatus('pending_sent');
                            return [2 /*return*/];
                        }
                        setStatus('none');
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        setStatus('none');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function sendRequest() {
        return __awaiter(this, arguments, void 0, function (asLover) {
            var err_1;
            var _a, _b;
            if (asLover === void 0) { asLover = false; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        setSaving(true);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, api_1.contactsApi.sendRequest(user.id)];
                    case 2:
                        _c.sent();
                        showToast('success', "Request sent! You can set the relationship type after they accept.");
                        setStatus('pending_sent');
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _c.sent();
                        showToast('error', ((_b = (_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed to send request');
                        return [3 /*break*/, 5];
                    case 4:
                        setSaving(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleBlock() {
        var _this = this;
        react_native_1.Alert.alert("Block ".concat(user.displayName, "?"), 'They will not be able to message you or send you requests.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Block',
                style: 'destructive',
                onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                setSaving(true);
                                _b.label = 1;
                            case 1:
                                _b.trys.push([1, 3, 4, 5]);
                                return [4 /*yield*/, api_1.contactsApi.blockContact(user.id)];
                            case 2:
                                _b.sent();
                                showToast('success', 'User blocked');
                                navigation.goBack();
                                return [3 /*break*/, 5];
                            case 3:
                                _a = _b.sent();
                                showToast('error', 'Failed to block');
                                return [3 /*break*/, 5];
                            case 4:
                                setSaving(false);
                                return [7 /*endfinally*/];
                            case 5: return [2 /*return*/];
                        }
                    });
                }); },
            },
        ]);
    }
    function handleUnblock() {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                react_native_1.Alert.alert("Unblock ".concat(user.displayName, "?"), 'Unblocking will not restore the contact relationship.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Unblock',
                        onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        setSaving(true);
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 3, 4, 5]);
                                        return [4 /*yield*/, api_1.contactsApi.unblockUser(user.id)];
                                    case 2:
                                        _b.sent();
                                        showToast('success', 'User unblocked');
                                        setStatus('none');
                                        return [3 /*break*/, 5];
                                    case 3:
                                        _a = _b.sent();
                                        showToast('error', 'Failed to unblock');
                                        return [3 /*break*/, 5];
                                    case 4:
                                        setSaving(false);
                                        return [7 /*endfinally*/];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); },
                    },
                ]);
                return [2 /*return*/];
            });
        });
    }
    return (<react_native_1.ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + name */}
      <react_native_1.View style={styles.header}>
        <Avatar_1.Avatar uri={user.avatarUrl} name={user.displayName} color={user.avatarColor} size={80}/>
        <react_native_1.Text style={[styles.displayName, { color: colors.dark }]}>{user.displayName}</react_native_1.Text>
        <react_native_1.Text style={[styles.username, { color: colors.gray400 }]}>@{user.username}</react_native_1.Text>
        {!!user.bio && (<react_native_1.Text style={[styles.bio, { color: colors.gray500 }]}>{user.bio}</react_native_1.Text>)}
      </react_native_1.View>

      {saving && <react_native_1.ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }}/>}

      {/* Action buttons based on status */}
      {status === 'loading' && <react_native_1.ActivityIndicator color={colors.primary}/>}

      {status === 'none' && (<react_native_1.View style={styles.actions}>
          <react_native_1.TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={function () { return sendRequest(false); }} disabled={saving}>
            <react_native_1.Text style={styles.btnText}>Add as Friend 💙</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.TouchableOpacity style={[styles.btn, { backgroundColor: '#E91E63' }]} onPress={function () { return setShowLoverModal(true); }} disabled={saving}>
            <react_native_1.Text style={styles.btnText}>Add as Lover ❤️</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>)}

      {status === 'pending_sent' && (<react_native_1.View style={styles.actions}>
          <react_native_1.View style={[styles.btn, { backgroundColor: colors.gray100 }]}>
            <react_native_1.Text style={[styles.btnText, { color: colors.gray500 }]}>Request Pending…</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>)}

      {status === 'pending_received' && (<react_native_1.View style={styles.actions}>
          <react_native_1.Text style={[styles.note, { color: colors.gray500 }]}>
            This user already sent you a request. Go to Notifications to accept.
          </react_native_1.Text>
        </react_native_1.View>)}

      {status === 'blocked' && (<react_native_1.View style={styles.actions}>
          <react_native_1.TouchableOpacity style={[styles.btn, { backgroundColor: colors.gray100 }]} onPress={handleUnblock} disabled={saving}>
            <react_native_1.Text style={[styles.btnText, { color: colors.dark }]}>Unblock</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>)}

      {/* Block button — always visible unless already blocked */}
      {status !== 'blocked' && status !== 'loading' && (<react_native_1.TouchableOpacity style={[styles.btn, styles.blockBtn]} onPress={handleBlock} disabled={saving}>
          <react_native_1.Text style={[styles.btnText, { color: '#F44336' }]}>Block</react_native_1.Text>
        </react_native_1.TouchableOpacity>)}

      {/* Lover confirmation modal */}
      <react_native_1.Modal visible={showLoverModal} transparent animationType="fade" onRequestClose={function () { return setShowLoverModal(false); }}>
        <react_native_1.View style={styles.modalOverlay}>
          <react_native_1.View style={[styles.modalBox, { backgroundColor: colors.bg }]}>
            <react_native_1.Text style={[styles.modalTitle, { color: colors.dark }]}>Add as Lover ❤️</react_native_1.Text>
            <react_native_1.Text style={[styles.modalBody, { color: colors.gray500 }]}>
              This sends a friend request to {user.displayName}.{'\n\n'}
              You can set the relationship type to "Lover" after they accept your request.
            </react_native_1.Text>
            <react_native_1.View style={styles.modalActions}>
              <react_native_1.TouchableOpacity onPress={function () { return setShowLoverModal(false); }} style={styles.modalCancel}>
                <react_native_1.Text style={[styles.modalCancelText, { color: colors.gray500 }]}>Cancel</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={[styles.modalConfirm, { backgroundColor: '#E91E63' }]} onPress={function () { setShowLoverModal(false); sendRequest(true); }}>
                <react_native_1.Text style={styles.modalConfirmText}>Send Request</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>
    </react_native_1.ScrollView>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingBottom: 40 },
        header: {
            alignItems: 'center',
            paddingTop: 32,
            paddingHorizontal: 24,
            paddingBottom: 24,
        },
        displayName: {
            fontSize: 22,
            fontWeight: '700',
            marginTop: 14,
        },
        username: {
            fontSize: 15,
            marginTop: 4,
        },
        bio: {
            fontSize: 14,
            textAlign: 'center',
            marginTop: 10,
            lineHeight: 20,
        },
        actions: {
            paddingHorizontal: 24,
            gap: 12,
        },
        btn: {
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
        },
        btnText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '600',
        },
        blockBtn: {
            marginHorizontal: 24,
            marginTop: 12,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: '#F44336',
        },
        note: {
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 20,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            paddingHorizontal: 32,
        },
        modalBox: {
            borderRadius: 16,
            padding: 24,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: '700',
            marginBottom: 12,
        },
        modalBody: {
            fontSize: 14,
            lineHeight: 21,
            marginBottom: 20,
        },
        modalActions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 12,
        },
        modalCancel: { paddingVertical: 8, paddingHorizontal: 16 },
        modalCancelText: { fontSize: 15, fontWeight: '500' },
        modalConfirm: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
        modalConfirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    });
}
