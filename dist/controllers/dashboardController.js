"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const auth_1 = require("../middleware/auth");
const Event_1 = __importDefault(require("../models/Event"));
const Task_1 = __importDefault(require("../models/Task"));
const Guest_1 = __importDefault(require("../models/Guest"));
const Booking_1 = __importDefault(require("../models/Booking"));
const ShoppingItem_1 = __importDefault(require("../models/ShoppingItem"));
const Activity_1 = __importDefault(require("../models/Activity"));
const getDashboardStats = async (req, res) => {
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        if (!weddingId) {
            return res.status(200).json({
                totalEvents: 0,
                taskStats: { total: 0, completed: 0, percentage: 0 },
                urgentTasks: [],
                guestStats: { total: 0, attending: 0, notAttending: 0, tentative: 0, pending: 0, brideSide: 0, groomSide: 0 },
                bookingStats: { totalNeeded: 0, confirmed: 0, negotiating: 0, unbooked: 0, cancelled: 0 },
                budgetStats: { eventBudget: 0, vendorSpend: 0, vendorAdvancePaid: 0, vendorBalanceDue: 0, shoppingBudget: 0, shoppingActual: 0 },
                recentActivities: []
            });
        }
        // 1. Get all events
        const events = await Event_1.default.find({ status: 'active', weddingId });
        // 2. Task stats
        const totalTasks = await Task_1.default.countDocuments({ weddingId });
        const completedTasks = await Task_1.default.countDocuments({ status: 'Completed', weddingId });
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        // Urgent tasks: Not Completed and due within next 7 days or overdue
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);
        const urgentTasks = await Task_1.default.find({
            status: { $ne: 'Completed' },
            dueDate: { $lte: sevenDaysFromNow },
            weddingId
        })
            .populate('eventId', 'name themeColor')
            .populate('assignedTo', 'name email role phone')
            .sort({ dueDate: 1 })
            .limit(10);
        // 3. Guest stats
        const guests = await Guest_1.default.find({ weddingId });
        const guestStats = {
            total: guests.length,
            attending: guests.filter(g => g.rsvpStatus === 'Attending').length,
            notAttending: guests.filter(g => g.rsvpStatus === 'Not Attending').length,
            tentative: guests.filter(g => g.rsvpStatus === 'Tentative').length,
            pending: guests.filter(g => g.rsvpStatus === 'Pending').length,
            brideSide: guests.filter(g => g.side === 'Bride').length,
            groomSide: guests.filter(g => g.side === 'Groom').length
        };
        // 4. Booking stats
        const bookings = await Booking_1.default.find({ weddingId });
        const bookingStats = {
            totalNeeded: bookings.length,
            confirmed: bookings.filter(b => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Booked').length,
            negotiating: bookings.filter(b => b.bookingStatus === 'Negotiating' || b.bookingStatus === 'Enquired').length,
            unbooked: bookings.filter(b => b.bookingStatus === 'Not Booked').length,
            cancelled: bookings.filter(b => b.bookingStatus === 'Cancelled').length
        };
        // 5. Budget & Finance
        // Get budget totals from events
        const totalEventBudget = events.reduce((sum, e) => sum + (e.budget || 0), 0);
        // Shopping spendings
        const shoppingItems = await ShoppingItem_1.default.find({ weddingId });
        const totalShoppingBudget = shoppingItems.reduce((sum, item) => sum + (item.budget || 0), 0);
        const totalShoppingActual = shoppingItems.reduce((sum, item) => sum + (item.status === 'Purchased' ? item.actualPrice : 0), 0);
        // Booking payments
        const advancePaidSum = bookings.reduce((sum, b) => sum + (b.advancePaid || 0), 0);
        const balanceDueSum = bookings.reduce((sum, b) => sum + (b.balanceDue || 0), 0);
        const totalVendorCost = advancePaidSum + balanceDueSum;
        // 6. Recent Activity log
        const recentActivities = await Activity_1.default.find({ weddingId })
            .sort({ createdAt: -1 })
            .limit(15);
        res.json({
            totalEvents: events.length,
            taskStats: {
                total: totalTasks,
                completed: completedTasks,
                percentage: completionPercentage
            },
            urgentTasks,
            guestStats,
            bookingStats,
            budgetStats: {
                eventBudget: totalEventBudget,
                vendorSpend: totalVendorCost,
                vendorAdvancePaid: advancePaidSum,
                vendorBalanceDue: balanceDueSum,
                shoppingBudget: totalShoppingBudget,
                shoppingActual: totalShoppingActual
            },
            recentActivities
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getDashboardStats = getDashboardStats;
