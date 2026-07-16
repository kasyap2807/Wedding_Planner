"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBooking = exports.updateBooking = exports.createBooking = exports.getBookings = void 0;
const Booking_1 = __importDefault(require("../models/Booking"));
const auth_1 = require("../middleware/auth");
const socket_1 = require("../socket");
const Activity_1 = __importDefault(require("../models/Activity"));
const getBookings = async (req, res) => {
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const bookings = await Booking_1.default.find({ weddingId }).populate('eventId', 'name themeColor').sort({ createdAt: -1 });
        res.json(bookings);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getBookings = getBookings;
const createBooking = async (req, res) => {
    const { vendorName, category, eventId, bookingStatus, bookingDate, contractSigned, advancePaid, balanceDue, finalPaymentDueDate, contactPerson, phone, trialDate, fittingDates, notes, contractUrl } = req.body;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        if (!weddingId) {
            return res.status(400).json({ message: 'Wedding workspace ID is required' });
        }
        if (req.user?.role !== 'admin' && req.user?.role !== 'family' && req.user?.role !== 'webadmin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const booking = new Booking_1.default({
            weddingId,
            vendorName,
            category,
            eventId,
            bookingStatus: bookingStatus || 'Not Booked',
            bookingDate,
            contractSigned: contractSigned || false,
            advancePaid: advancePaid || 0,
            balanceDue: balanceDue || 0,
            finalPaymentDueDate,
            contactPerson,
            phone,
            trialDate,
            fittingDates: fittingDates || [],
            notes,
            contractUrl
        });
        await booking.save();
        const populatedBooking = await Booking_1.default.findOne({ _id: booking._id, weddingId }).populate('eventId', 'name themeColor');
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'CREATE_BOOKING',
            details: `Created vendor booking with "${booking.vendorName}" (${booking.category})`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('booking_change', { action: 'create', booking: populatedBooking });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.status(201).json(populatedBooking);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.createBooking = createBooking;
const updateBooking = async (req, res) => {
    const { id } = req.params;
    const { vendorName, category, eventId, bookingStatus, bookingDate, contractSigned, advancePaid, balanceDue, finalPaymentDueDate, contactPerson, phone, trialDate, fittingDates, notes, contractUrl } = req.body;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        if (req.user?.role !== 'admin' && req.user?.role !== 'family' && req.user?.role !== 'webadmin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const booking = await Booking_1.default.findOneAndUpdate({ _id: id, weddingId }, {
            vendorName,
            category,
            eventId,
            bookingStatus,
            bookingDate,
            contractSigned,
            advancePaid,
            balanceDue,
            finalPaymentDueDate,
            contactPerson,
            phone,
            trialDate,
            fittingDates,
            notes,
            contractUrl
        }, { new: true }).populate('eventId', 'name themeColor');
        if (!booking)
            return res.status(404).json({ message: 'Booking not found' });
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'UPDATE_BOOKING',
            details: `Updated booking for "${booking.vendorName}" (Status: ${booking.bookingStatus})`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('booking_change', { action: 'update', booking });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.json(booking);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateBooking = updateBooking;
const deleteBooking = async (req, res) => {
    const { id } = req.params;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        if (req.user?.role !== 'admin' && req.user?.role !== 'webadmin') {
            return res.status(403).json({ message: 'Only admins can delete bookings' });
        }
        const booking = await Booking_1.default.findOneAndDelete({ _id: id, weddingId });
        if (!booking)
            return res.status(404).json({ message: 'Booking not found' });
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'DELETE_BOOKING',
            details: `Removed booking for "${booking.vendorName}"`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('booking_change', { action: 'delete', id });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.json({ message: 'Booking removed successfully', id });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.deleteBooking = deleteBooking;
