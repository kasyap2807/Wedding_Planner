"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeddingId = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'wedding_planner_secret_key_12345_super_secure_98765';
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // webadmin can bypass standard roles to act on behalf of workspace roles
        if (req.user.role === 'webadmin' || roles.includes(req.user.role)) {
            next();
        }
        else {
            return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
        }
    };
};
exports.requireRole = requireRole;
const getWeddingId = (req) => {
    if (req.user?.role === 'webadmin') {
        return req.headers['x-wedding-id'] || req.query.weddingId || undefined;
    }
    return req.user?.weddingId;
};
exports.getWeddingId = getWeddingId;
