"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShoppingItem = exports.updateShoppingItem = exports.createShoppingItem = exports.getShoppingItems = void 0;
const ShoppingItem_1 = __importDefault(require("../models/ShoppingItem"));
const auth_1 = require("../middleware/auth");
const socket_1 = require("../socket");
const Activity_1 = __importDefault(require("../models/Activity"));
const getShoppingItems = async (req, res) => {
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const items = await ShoppingItem_1.default.find({ weddingId })
            .populate('assignedTo', 'name email role phone')
            .populate('eventId', 'name themeColor')
            .sort({ createdAt: -1 });
        res.json(items);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getShoppingItems = getShoppingItems;
const createShoppingItem = async (req, res) => {
    const { name, quantity, budget, actualPrice, store, status, assignedTo, category, eventId, receiptUrl } = req.body;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        if (!weddingId) {
            return res.status(400).json({ message: 'Wedding workspace ID is required' });
        }
        const item = new ShoppingItem_1.default({
            weddingId,
            name,
            quantity: quantity || 1,
            budget: budget || 0,
            actualPrice: actualPrice || 0,
            store,
            status: status || 'Pending',
            assignedTo: assignedTo || null,
            category,
            eventId: eventId || null,
            receiptUrl
        });
        await item.save();
        const populatedItem = await ShoppingItem_1.default.findOne({ _id: item._id, weddingId })
            .populate('assignedTo', 'name email role phone')
            .populate('eventId', 'name themeColor');
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'ADD_SHOPPING_ITEM',
            details: `Added shopping item: "${item.name}" (Category: ${item.category})`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('shopping_change', { action: 'create', item: populatedItem });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.status(201).json(populatedItem);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.createShoppingItem = createShoppingItem;
const updateShoppingItem = async (req, res) => {
    const { id } = req.params;
    const { name, quantity, budget, actualPrice, store, status, assignedTo, category, eventId, receiptUrl } = req.body;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const item = await ShoppingItem_1.default.findOne({ _id: id, weddingId });
        if (!item)
            return res.status(404).json({ message: 'Shopping item not found' });
        if (name !== undefined)
            item.name = name;
        if (quantity !== undefined)
            item.quantity = quantity;
        if (budget !== undefined)
            item.budget = budget;
        if (actualPrice !== undefined)
            item.actualPrice = actualPrice;
        if (store !== undefined)
            item.store = store;
        if (status !== undefined)
            item.status = status;
        if (assignedTo !== undefined)
            item.assignedTo = assignedTo;
        if (category !== undefined)
            item.category = category;
        if (eventId !== undefined)
            item.eventId = eventId;
        if (receiptUrl !== undefined)
            item.receiptUrl = receiptUrl;
        await item.save();
        const populatedItem = await ShoppingItem_1.default.findOne({ _id: item._id, weddingId })
            .populate('assignedTo', 'name email role phone')
            .populate('eventId', 'name themeColor');
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'User',
            action: 'UPDATE_SHOPPING_ITEM',
            details: `Updated shopping item "${item.name}" (Status: ${item.status})`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('shopping_change', { action: 'update', item: populatedItem });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.json(populatedItem);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateShoppingItem = updateShoppingItem;
const deleteShoppingItem = async (req, res) => {
    const { id } = req.params;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        if (req.user?.role !== 'admin' && req.user?.role !== 'family' && req.user?.role !== 'webadmin') {
            return res.status(403).json({ message: 'Unauthorized to delete items' });
        }
        const item = await ShoppingItem_1.default.findOneAndDelete({ _id: id, weddingId });
        if (!item)
            return res.status(404).json({ message: 'Shopping item not found' });
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'DELETE_SHOPPING_ITEM',
            details: `Removed shopping item: "${item.name}"`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('shopping_change', { action: 'delete', id });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.json({ message: 'Shopping item deleted successfully', id });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.deleteShoppingItem = deleteShoppingItem;
