"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.getAllUsers = exports.getProfile = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Wedding_1 = __importDefault(require("../models/Wedding"));
const Event_1 = __importDefault(require("../models/Event"));
const auth_1 = require("../middleware/auth");
const JWT_SECRET = process.env.JWT_SECRET || 'wedding_planner_secret_key_12345_super_secure_98765';
const register = async (req, res) => {
    const { name, email, password, role, phone } = req.body;
    try {
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Automatically create a new Wedding Workspace for self-signed admins
        let weddingId = undefined;
        const userRole = role || 'admin';
        if (userRole !== 'webadmin') {
            const wedding = new Wedding_1.default({
                name: `${name}'s Wedding`,
                date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year from now
                code: `wedding-${Date.now()}`
            });
            await wedding.save();
            weddingId = wedding._id;
            // Seed the 4 default sub-events for this wedding workspace
            const weddingDate = wedding.date;
            const dayMs = 24 * 60 * 60 * 1000;
            const defaultEvents = [
                {
                    weddingId: wedding._id,
                    name: 'Mehendi Ceremony',
                    date: new Date(weddingDate.getTime() - 2 * dayMs),
                    themeColor: 'mehendi',
                    description: 'Traditional henna and music night',
                    location: 'Grand Lawn Poolside',
                    budget: 150000
                },
                {
                    weddingId: wedding._id,
                    name: 'Haldi Ceremony',
                    date: new Date(weddingDate.getTime() - 1 * dayMs),
                    themeColor: 'haldi',
                    description: 'Festive marigold-themed haldi ceremony',
                    location: 'Terrace Garden',
                    budget: 100000
                },
                {
                    weddingId: wedding._id,
                    name: 'Wedding Ceremony',
                    date: weddingDate,
                    themeColor: 'wedding',
                    description: 'Main wedding ceremony celebrations',
                    location: 'Royal Ballroom',
                    budget: 500000
                },
                {
                    weddingId: wedding._id,
                    name: 'Grand Reception',
                    date: new Date(weddingDate.getTime() + 1 * dayMs),
                    themeColor: 'reception',
                    description: 'Post-wedding celebrations and grand dinner',
                    location: 'Grand Exhibition Hall',
                    budget: 400000
                }
            ];
            await Event_1.default.insertMany(defaultEvents);
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = new User_1.default({
            name,
            email,
            passwordHash,
            role: userRole,
            weddingId,
            phone
        });
        await user.save();
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, name: user.name, email: user.email, weddingId: user.weddingId }, JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                weddingId: user.weddingId,
                phone: user.phone
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, name: user.name, email: user.email, weddingId: user.weddingId }, JWT_SECRET, { expiresIn: '30d' });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                weddingId: user.weddingId,
                phone: user.phone
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const user = await User_1.default.findById(req.user.id).select('-passwordHash');
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getProfile = getProfile;
const getAllUsers = async (req, res) => {
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        // Standard users only see users inside their own wedding workspace
        const filter = req.user?.role === 'webadmin' ? {} : { weddingId };
        const users = await User_1.default.find(filter).select('-passwordHash');
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getAllUsers = getAllUsers;
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        if (req.user?.role !== 'admin' && req.user?.role !== 'webadmin') {
            return res.status(403).json({ message: 'Only admins can change roles' });
        }
        // Standard admins can only update users in their own wedding workspace
        const filter = req.user?.role === 'webadmin' ? { _id: id } : { _id: id, weddingId };
        const user = await User_1.default.findOneAndUpdate(filter, { role }, { new: true }).select('-passwordHash');
        if (!user)
            return res.status(404).json({ message: 'User not found or access denied' });
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateUserRole = updateUserRole;
