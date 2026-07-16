"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addComment = exports.deleteTask = exports.updateTask = exports.createTask = exports.getTasks = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const User_1 = __importDefault(require("../models/User"));
const Wedding_1 = __importDefault(require("../models/Wedding"));
const auth_1 = require("../middleware/auth");
const socket_1 = require("../socket");
const Activity_1 = __importDefault(require("../models/Activity"));
const mailer_1 = require("../utils/mailer");
const getTasks = async (req, res) => {
    const { eventId } = req.query;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const filter = { weddingId };
        if (eventId)
            filter.eventId = eventId;
        const tasks = await Task_1.default.find(filter)
            .populate('assignedTo', 'name email role phone')
            .populate('eventId', 'name themeColor')
            .sort({ dueDate: 1 });
        res.json(tasks);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getTasks = getTasks;
const createTask = async (req, res) => {
    const { name, description, category, eventId, assignedTo, priority, dueDate, checklist } = req.body;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        if (!weddingId) {
            return res.status(400).json({ message: 'Wedding workspace ID is required' });
        }
        // Only admin and family can create tasks
        if (req.user?.role !== 'admin' && req.user?.role !== 'family' && req.user?.role !== 'webadmin') {
            return res.status(403).json({ message: 'Only Admin and Family members can create tasks' });
        }
        const task = new Task_1.default({
            weddingId,
            name,
            description,
            category,
            eventId,
            assignedTo: assignedTo || [],
            priority: priority || 'Medium',
            dueDate,
            checklist: checklist || [],
            status: 'Not Started'
        });
        await task.save();
        const populatedTask = await Task_1.default.findOne({ _id: task._id, weddingId })
            .populate('assignedTo', 'name email role phone')
            .populate('eventId', 'name themeColor');
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'CREATE_TASK',
            details: `Created task "${task.name}"`
        });
        await activity.save();
        // Trigger email alerts for all assignees
        if (assignedTo && assignedTo.length > 0) {
            const wedding = await Wedding_1.default.findById(weddingId);
            const assignees = await User_1.default.find({ _id: { $in: assignedTo } });
            for (const u of assignees) {
                if (u.email) {
                    await (0, mailer_1.sendTaskAssignmentEmail)(u.email, u.name, task.name, task.dueDate, wedding?.name || 'Your Wedding Workspace');
                }
            }
        }
        (0, socket_1.broadcastUpdate)('task_change', { action: 'create', task: populatedTask });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.status(201).json(populatedTask);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
    const { id } = req.params;
    const { name, description, category, eventId, assignedTo, priority, dueDate, status, checklist, comments } = req.body;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const task = await Task_1.default.findOne({ _id: id, weddingId });
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        // Role-based verification: Members (Family, Volunteer) can only edit tasks assigned to them.
        if (req.user?.role !== 'admin' && req.user?.role !== 'webadmin') {
            const isAssigned = task.assignedTo.some(userId => userId.toString() === req.user?.id);
            if (!isAssigned) {
                return res.status(403).json({ message: 'You are only authorized to update tasks assigned to you' });
            }
        }
        // Track previous assignees to check for new ones
        const previousAssignees = task.assignedTo.map(uid => uid.toString());
        // Admins and family can update everything.
        if (req.user?.role === 'admin' || req.user?.role === 'family' || req.user?.role === 'webadmin') {
            if (name !== undefined)
                task.name = name;
            if (description !== undefined)
                task.description = description;
            if (category !== undefined)
                task.category = category;
            if (eventId !== undefined)
                task.eventId = eventId;
            if (assignedTo !== undefined)
                task.assignedTo = assignedTo;
            if (priority !== undefined)
                task.priority = priority;
            if (dueDate !== undefined)
                task.dueDate = dueDate;
        }
        if (status !== undefined)
            task.status = status;
        if (checklist !== undefined)
            task.checklist = checklist;
        if (comments !== undefined)
            task.comments = comments;
        await task.save();
        const populatedTask = await Task_1.default.findOne({ _id: task._id, weddingId })
            .populate('assignedTo', 'name email role phone')
            .populate('eventId', 'name themeColor');
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'User',
            action: 'UPDATE_TASK',
            details: `Updated task "${task.name}" (Status: ${task.status}, Progress: ${task.completionPercentage}%)`
        });
        await activity.save();
        // Trigger email alerts for NEW assignees
        if (assignedTo && assignedTo.length > 0) {
            const newAssigneeIds = assignedTo.filter((uid) => !previousAssignees.includes(uid.toString()));
            if (newAssigneeIds.length > 0) {
                const wedding = await Wedding_1.default.findById(weddingId);
                const newAssignees = await User_1.default.find({ _id: { $in: newAssigneeIds } });
                for (const u of newAssignees) {
                    if (u.email) {
                        await (0, mailer_1.sendTaskAssignmentEmail)(u.email, u.name, task.name, task.dueDate, wedding?.name || 'Your Wedding Workspace');
                    }
                }
            }
        }
        (0, socket_1.broadcastUpdate)('task_change', { action: 'update', task: populatedTask });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.json(populatedTask);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    const { id } = req.params;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const task = await Task_1.default.findOne({ _id: id, weddingId });
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        // Only admin or family can delete tasks
        if (req.user?.role !== 'admin' && req.user?.role !== 'family' && req.user?.role !== 'webadmin') {
            return res.status(403).json({ message: 'Unauthorized to delete tasks' });
        }
        await Task_1.default.findOneAndDelete({ _id: id, weddingId });
        // Log activity
        const activity = new Activity_1.default({
            weddingId,
            userId: req.user?.id,
            userName: req.user?.name || 'Admin',
            action: 'DELETE_TASK',
            details: `Deleted task "${task.name}"`
        });
        await activity.save();
        (0, socket_1.broadcastUpdate)('task_change', { action: 'delete', id });
        (0, socket_1.broadcastUpdate)('activity_change', activity);
        res.json({ message: 'Task deleted successfully', id });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.deleteTask = deleteTask;
// Comment on a task
const addComment = async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const weddingId = (0, auth_1.getWeddingId)(req);
    try {
        const task = await Task_1.default.findOne({ _id: id, weddingId });
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        // Add comment
        task.comments.push({
            userId: req.user?.id,
            userName: req.user?.name || 'Anonymous',
            text,
            createdAt: new Date()
        });
        await task.save();
        const populatedTask = await Task_1.default.findOne({ _id: task._id, weddingId })
            .populate('assignedTo', 'name email role phone')
            .populate('eventId', 'name themeColor');
        (0, socket_1.broadcastUpdate)('task_change', { action: 'update', task: populatedTask });
        res.json(populatedTask);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.addComment = addComment;
