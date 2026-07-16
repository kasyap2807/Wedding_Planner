import { Response } from 'express';
import Event from '../models/Event';
import Task from '../models/Task';
import { AuthRequest, getWeddingId } from '../middleware/auth';
import { broadcastUpdate } from '../socket';
import Activity from '../models/Activity';

export const getEvents = async (req: AuthRequest, res: Response) => {
  const weddingId = getWeddingId(req);
  try {
    const events = await Event.find({ status: 'active', weddingId }).sort({ date: 1 });
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getEventById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const weddingId = getWeddingId(req);
  try {
    const event = await Event.findOne({ _id: id, weddingId });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  const { name, date, themeColor, description, location, budget } = req.body;
  const weddingId = getWeddingId(req);

  try {
    if (!weddingId) {
      return res.status(400).json({ message: 'Wedding workspace ID is required' });
    }

    const event = new Event({
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
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'CREATE_EVENT',
      details: `Created new event: "${event.name}"`
    });
    await activity.save();

    broadcastUpdate('event_change', { action: 'create', event });
    broadcastUpdate('activity_change', activity);
    res.status(201).json(event);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, date, themeColor, description, location, budget, status } = req.body;
  const weddingId = getWeddingId(req);

  try {
    const event = await Event.findOneAndUpdate(
      { _id: id, weddingId },
      { name, date, themeColor, description, location, budget, status },
      { new: true }
    );

    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'UPDATE_EVENT',
      details: `Updated event: "${event.name}"`
    });
    await activity.save();

    broadcastUpdate('event_change', { action: 'update', event });
    broadcastUpdate('activity_change', activity);
    res.json(event);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const weddingId = getWeddingId(req);

  try {
    const event = await Event.findOne({ _id: id, weddingId });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Mark as archived instead of delete
    event.status = 'archived';
    await event.save();

    // Also delete or archive tasks of this event
    await Task.updateMany({ eventId: id, weddingId }, { status: 'Cancelled' });

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'DELETE_EVENT',
      details: `Archived event: "${event.name}"`
    });
    await activity.save();

    broadcastUpdate('event_change', { action: 'delete', id });
    broadcastUpdate('activity_change', activity);
    res.json({ message: 'Event archived successfully', id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
