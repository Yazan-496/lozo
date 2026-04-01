"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Avatar = Avatar;
var react_native_1 = require("react-native");
var useThemeColors_1 = require("../hooks/useThemeColors");
function Avatar(_a) {
    var uri = _a.uri, name = _a.name, color = _a.color, _b = _a.size, size = _b === void 0 ? 48 : _b, isOnline = _a.isOnline;
    var colors = (0, useThemeColors_1.useThemeColors)();
    var fontSize = size * 0.4;
    var initial = name.charAt(0).toUpperCase();
    var dotSize = size * 0.26;
    return (<react_native_1.View style={{ width: size, height: size }}>
      {uri ? (<react_native_1.Image source={{ uri: uri }} style={{ width: size, height: size, borderRadius: size / 2 }}/>) : (<react_native_1.View style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                alignItems: 'center',
                justifyContent: 'center',
            }}>
          <react_native_1.Text style={{ color: '#fff', fontSize: fontSize, fontWeight: '700' }}>
            {initial}
          </react_native_1.Text>
        </react_native_1.View>)}
      {isOnline !== undefined && (<react_native_1.View style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: isOnline ? colors.green : colors.gray300,
                borderWidth: 2.5,
                borderColor: colors.bg,
            }}/>)}
    </react_native_1.View>);
}
