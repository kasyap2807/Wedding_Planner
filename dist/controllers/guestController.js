"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGuest = exports.updateGuest = exports.createGuest = exports.getGuests = void 0;
const Guest_1 = __importDefault(require("../models/Guest"));
const auth_1 = require("../middleware/auth");
const socket_1 = require("../socket");
const Activity_1 = __importDefault(require("../models/Activity"));
const getGuests = async (req, res) => {
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const guests = await Guest_1.default.find({ weddingId }).sort({ name: 1 });
        res.json(guests);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getGuests = getGuests;
const createGuest = async (req, res) => {
    const { name, relation, side, rsvpStatus, invitationSent, foodPreference, phone, email, notes } = req.body;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        if (!weddingId) {
            return res.status(400).json({ message: 'Wedding workspace ID is required' });
        }
        const guest = new Guest_1.default({
            weddingId,
            name,
            relation,
            side,
            rsvpStatus: rsvpStatus || 'Pending',
            invitationSent: invitationSent || false,
            foodPreference: foodPreference || 'Any',
            phone,
            email,
            notes
        });
        await guest.save();
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'ADD_GUEST',
            details: `Added guest: "${guest.name}" (${guest.side}'s side)`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('guest_change', { action: 'create', guest });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.status(201).json(guest);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.createGuest = createGuest;
const updateGuest = async (req, res) => {
    const { id } = req.params;
    const { name, relation, side, rsvpStatus, invitationSent, foodPreference, phone, email, notes } = req.body;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const guest = await Guest_1.default.findOneAndUpdate({ _id: id, weddingId }, { name, relation, side, rsvpStatus, invitationSent, foodPreference, phone, email, notes }, { new: true });
        if (!guest)
            return res.status(404).json({ message: 'Guest not found' });
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'UPDATE_GUEST',
            details: `Updated guest details for: "${guest.name}" (RSVP: ${guest.rsvpStatus})`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('guest_change', { action: 'update', guest });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.json(guest);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateGuest = updateGuest;
const deleteGuest = async (req, res) => {
    const { id } = req.params;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const guest = await Guest_1.default.findOneAndDelete({ _id: id, weddingId });
        if (!guest)
            return res.status(404).json({ message: 'Guest not found' });
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'DELETE_GUEST',
            details: `Removed guest: "${guest.name}"`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('guest_change', { action: 'delete', id });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.json({ message: 'Guest deleted successfully', id });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.deleteGuest = deleteGuest;
