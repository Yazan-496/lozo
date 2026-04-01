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
exports.NotificationsScreen = NotificationsScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var native_1 = require("@react-navigation/native");
var Avatar_1 = require("../../shared/components/Avatar");
var Toast_1 = require("../../shared/components/Toast");
var api_1 = require("../../shared/services/api");
var notifications_1 = require("../../shared/stores/notifications");
var useThemeColors_1 = require("../../shared/hooks/useThemeColors");
function NotificationsScreen() {
    var _this = this;
    var _a = (0, react_1.useState)([]), pending = _a[0], setPending = _a[1];
    var _b = (0, react_1.useState)(false), refreshing = _b[0], setRefreshing = _b[1];
    var setPendingCount = (0, notifications_1.useNotificationsStore)(function (s) { return s.setPendingRequestsCount; });
    var colors = (0, useThemeColors_1.useThemeColors)();
    var styles = (0, react_1.useMemo)(function () { return makeStyles(colors); }, [colors]);
    var showToast = (0, Toast_1.useToast)().showToast;
    function load() {
        return __awaiter(this, void 0, void 0, function () {
            var data, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, api_1.api.get('/contacts/pending')];
                    case 1:
                        data = (_b.sent()).data;
                        setPending(data);
                        setPendingCount(data.length);
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    (0, native_1.useFocusEffect)((0, react_1.useCallback)(function () { load(); }, []));
    function handleAccept(contactId) {
        return __awaiter(this, void 0, void 0, function () {
            var err_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, api_1.api.post("/contacts/accept/".concat(contactId))];
                    case 1:
                        _c.sent();
                        load();
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _c.sent();
                        showToast('error', ((_b = (_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function handleReject(contactId) {
        return __awaiter(this, void 0, void 0, function () {
            var err_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, api_1.api.post("/contacts/reject/".concat(contactId))];
                    case 1:
                        _c.sent();
                        load();
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _c.sent();
                        showToast('error', ((_b = (_a = err_2.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Failed');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    return (<react_native_1.FlatList style={styles.container} data={pending} keyExtractor={function (item) { return item.contactId; }} contentContainerStyle={pending.length === 0 ? styles.emptyContainer : undefined} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setRefreshing(true);
                            return [4 /*yield*/, load()];
                        case 1:
                            _a.sent();
                            setRefreshing(false);
                            return [2 /*return*/];
                    }
                });
            }); }}/>} renderItem={function (_a) {
            var item = _a.item;
            return (<react_native_1.View style={styles.row}>
          <Avatar_1.Avatar uri={item.from.avatarUrl} name={item.from.displayName} color={item.from.avatarColor} size={50}/>
          <react_native_1.View style={styles.info}>
            <react_native_1.Text style={styles.name}>{item.from.displayName}</react_native_1.Text>
            <react_native_1.Text style={styles.handle}>@{item.from.username} sent you a friend request</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.actions}>
            <react_native_1.TouchableOpacity style={styles.acceptBtn} onPress={function () { return handleAccept(item.contactId); }}>
              <react_native_1.Text style={styles.acceptText}>Accept</react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={styles.declineBtn} onPress={function () { return handleReject(item.contactId); }}>
              <react_native_1.Text style={styles.declineText}>Decline</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>);
        }} ListEmptyComponent={<react_native_1.View style={styles.empty}>
          <react_native_1.Text style={styles.emptyIcon}>🔔</react_native_1.Text>
          <react_native_1.Text style={styles.emptyTitle}>No notifications</react_native_1.Text>
          <react_native_1.Text style={styles.emptySubtitle}>Friend requests will appear here</react_native_1.Text>
        </react_native_1.View>}/>);
}
function makeStyles(colors) {
    return react_native_1.StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.bg,
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        info: {
            flex: 1,
            marginLeft: 12,
        },
        name: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.dark,
        },
        handle: {
            fontSize: 13,
            color: colors.gray400,
            marginTop: 2,
        },
        actions: {
            flexDirection: 'row',
            gap: 8,
        },
        acceptBtn: {
            backgroundColor: colors.primary,
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 20,
        },
        acceptText: {
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: '600',
        },
        declineBtn: {
            backgroundColor: colors.gray100,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 20,
        },
        declineText: {
            color: colors.gray500,
            fontSize: 13,
        },
        empty: {
            alignItems: 'center',
            paddingTop: 40,
        },
        emptyIcon: {
            fontSize: 48,
            marginBottom: 12,
        },
        emptyTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.dark,
        },
        emptySubtitle: {
            fontSize: 14,
            color: colors.gray400,
            marginTop: 4,
        },
    });
}
