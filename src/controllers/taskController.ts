import { Response } from 'express';
import Task from '../models/Task';
import User from '../models/User';
import Wedding from '../models/Wedding';
import { AuthRequest, getWeddingId } from '../middleware/auth';
import { broadcastUpdate } from '../socket';
import Activity from '../models/Activity';
import { sendTaskAssignmentEmail } from '../utils/mailer';

export const getTasks = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.query;
  const weddingId = getWeddingId(req);
  try {
    const filter: any = { weddingId };
    if (eventId) filter.eventId = eventId;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email role phone')
      .populate('eventId', 'name themeColor')
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  const { name, description, category, eventId, assignedTo, priority, dueDate, checklist } = req.body;
  const weddingId = getWeddingId(req);

  try {
    if (!weddingId) {
      return res.status(400).json({ message: 'Wedding workspace ID is required' });
    }

    // Only admin and family can create tasks
    if (req.user?.role !== 'admin' && req.user?.role !== 'family' && req.user?.role !== 'webadmin') {
      return res.status(403).json({ message: 'Only Admin and Family members can create tasks' });
    }

    const task = new Task({
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

    const populatedTask = await Task.findOne({ _id: task._id, weddingId })
      .populate('assignedTo', 'name email role phone')
      .populate('eventId', 'name themeColor');

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'CREATE_TASK',
      details: `Created task "${task.name}"`
    });
    await activity.save();

    // Trigger email alerts for all assignees
    if (assignedTo && assignedTo.length > 0) {
      const wedding = await Wedding.findById(weddingId);
      const assignees = await User.find({ _id: { $in: assignedTo } });
      for (const u of assignees) {
        if (u.email) {
          await sendTaskAssignmentEmail(
            u.email,
            u.name,
            task.name,
            task.dueDate,
            wedding?.name || 'Your Wedding Workspace'
          );
        }
      }
    }

    broadcastUpdate('task_change', { action: 'create', task: populatedTask });
    broadcastUpdate('activity_change', activity);
    res.status(201).json(populatedTask);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, category, eventId, assignedTo, priority, dueDate, status, checklist, comments } = req.body;
  const weddingId = getWeddingId(req);

  try {
    const task = await Task.findOne({ _id: id, weddingId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

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
      if (name !== undefined) task.name = name;
      if (description !== undefined) task.description = description;
      if (category !== undefined) task.category = category;
      if (eventId !== undefined) task.eventId = eventId;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
    }

    if (status !== undefined) task.status = status;
    if (checklist !== undefined) task.checklist = checklist;
    if (comments !== undefined) task.comments = comments;

    await task.save();

    const populatedTask = await Task.findOne({ _id: task._id, weddingId })
      .populate('assignedTo', 'name email role phone')
      .populate('eventId', 'name themeColor');

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'User',
      action: 'UPDATE_TASK',
      details: `Updated task "${task.name}" (Status: ${task.status}, Progress: ${task.completionPercentage}%)`
    });
    await activity.save();

    // Trigger email alerts for NEW assignees
    if (assignedTo && assignedTo.length > 0) {
      const newAssigneeIds = assignedTo.filter((uid: string) => !previousAssignees.includes(uid.toString()));
      if (newAssigneeIds.length > 0) {
        const wedding = await Wedding.findById(weddingId);
        const newAssignees = await User.find({ _id: { $in: newAssigneeIds } });
        for (const u of newAssignees) {
          if (u.email) {
            await sendTaskAssignmentEmail(
              u.email,
              u.name,
              task.name,
              task.dueDate,
              wedding?.name || 'Your Wedding Workspace'
            );
          }
        }
      }
    }

    broadcastUpdate('task_change', { action: 'update', task: populatedTask });
    broadcastUpdate('activity_change', activity);
    res.json(populatedTask);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const weddingId = getWeddingId(req);

  try {
    const task = await Task.findOne({ _id: id, weddingId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Only admin or family can delete tasks
    if (req.user?.role !== 'admin' && req.user?.role !== 'family' && req.user?.role !== 'webadmin') {
      return res.status(403).json({ message: 'Unauthorized to delete tasks' });
    }

    await Task.findOneAndDelete({ _id: id, weddingId });

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'DELETE_TASK',
      details: `Deleted task "${task.name}"`
    });
    await activity.save();

    broadcastUpdate('task_change', { action: 'delete', id });
    broadcastUpdate('activity_change', activity);
    res.json({ message: 'Task deleted successfully', id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Comment on a task
export const addComment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { text } = req.body;
  const weddingId = getWeddingId(req);

  try {
    const task = await Task.findOne({ _id: id, weddingId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Add comment
    task.comments.push({
      userId: req.user?.id as any,
      userName: req.user?.name || 'Anonymous',
      text,
      createdAt: new Date()
    });

    await task.save();

    const populatedTask = await Task.findOne({ _id: task._id, weddingId })
      .populate('assignedTo', 'name email role phone')
      .populate('eventId', 'name themeColor');

    broadcastUpdate('task_change', { action: 'update', task: populatedTask });
    res.json(populatedTask);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
