"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var error_handler_1 = require("./error-handler");
function authenticate(req, _res, next) {
    var header = req.headers.authorization;
    if (!(header === null || header === void 0 ? void 0 : header.startsWith('Bearer '))) {
        throw new error_handler_1.AppError(401, 'Missing or invalid token');
    }
    var token = header.split(' ')[1];
    try {
        var payload = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = payload;
        next();
    }
    catch (_a) {
        throw new error_handler_1.AppError(401, 'Token expired or invalid');
    }
}
