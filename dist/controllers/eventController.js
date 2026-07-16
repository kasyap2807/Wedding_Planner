"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventById = exports.getEvents = void 0;
const Event_1 = __importDefault(require("../models/Event"));
const Task_1 = __importDefault(require("../models/Task"));
const auth_1 = require("../middleware/auth");
const socket_1 = require("../socket");
const Activity_1 = __importDefault(require("../models/Activity"));
const getEvents = async (req, res) => {
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const events = await Event_1.default.find({ status: 'active', weddingId }).sort({ date: 1 });
        res.json(events);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getEvents = getEvents;
const getEventById = async (req, res) => {
    const { id } = req.params;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const event = await Event_1.default.findOne({ _id: id, weddingId });
        if (!event)
            return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getEventById = getEventById;
const createEvent = async (req, res) => {
    const { name, date, themeColor, description, location, budget } = req.body;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        if (!weddingId) {
            return res.status(400).json({ message: 'Wedding workspace ID is required' });
        }
        const event = new Event_1.default({
            weddingId,
            name,
            date,
            themeColor: themeColor || 'custom',
            description,
            location,
            budget: budget || 0
        });
        await event.save();
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'CREATE_EVENT',
            details: `Created new event: "${event.name}"`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('event_change', { action: 'create', event });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.status(201).json(event);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.createEvent = createEvent;
const updateEvent = async (req, res) => {
    const { id } = req.params;
    const { name, date, themeColor, description, location, budget, status } = req.body;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const event = await Event_1.default.findOneAndUpdate({ _id: id, weddingId }, { name, date, themeColor, description, location, budget, status }, { new: true });
        if (!event)
            return res.status(404).json({ message: 'Event not found' });
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'UPDATE_EVENT',
            details: `Updated event: "${event.name}"`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('event_change', { action: 'update', event });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.json(event);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    const { id } = req.params;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const event = await Event_1.default.findOne({ _id: id, weddingId });
        if (!event)
            return res.status(404).json({ message: 'Event not found' });
        // Mark as archived instead of delete
        event.status = 'archived';
        await event.save();
        // Also delete or archive tasks of this event
        await Task_1.default.updateMany({ eventId: id, weddingId }, { status: 'Cancelled' });
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'DELETE_EVENT',
            details: `Archived event: "${event.name}"`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('event_change', { action: 'delete', id });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.json({ message: 'Event archived successfully', id });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.deleteEvent = deleteEvent;
