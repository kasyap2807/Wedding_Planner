import { Response } from 'express';
import Guest from '../models/Guest';
import { AuthRequest, getWeddingId } from '../middleware/auth';
import { broadcastUpdate } from '../socket';
import Activity from '../models/Activity';

export const getGuests = async (req: AuthRequest, res: Response) => {
  const weddingId = getWeddingId(req);
  try {
    const guests = await Guest.find({ weddingId }).sort({ name: 1 });
    res.json(guests);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createGuest = async (req: AuthRequest, res: Response) => {
  const { name, relation, side, rsvpStatus, invitationSent, foodPreference, phone, email, notes } = req.body;
  const weddingId = getWeddingId(req);

  try {
    if (!weddingId) {
      return res.status(400).json({ message: 'Wedding workspace ID is required' });
    }

    const guest = new Guest({
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
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'ADD_GUEST',
      details: `Added guest: "${guest.name}" (${guest.side}'s side)`
    });
    await activity.save();

    broadcastUpdate('guest_change', { action: 'create', guest });
    broadcastUpdate('activity_change', activity);
    res.status(201).json(guest);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateGuest = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, relation, side, rsvpStatus, invitationSent, foodPreference, phone, email, notes } = req.body;
  const weddingId = getWeddingId(req);

  try {
    const guest = await Guest.findOneAndUpdate(
      { _id: id, weddingId },
      { name, relation, side, rsvpStatus, invitationSent, foodPreference, phone, email, notes },
      { new: true }
    );

    if (!guest) return res.status(404).json({ message: 'Guest not found' });

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'UPDATE_GUEST',
      details: `Updated guest details for: "${guest.name}" (RSVP: ${guest.rsvpStatus})`
    });
    await activity.save();

    broadcastUpdate('guest_change', { action: 'update', guest });
    broadcastUpdate('activity_change', activity);
    res.json(guest);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteGuest = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const weddingId = getWeddingId(req);

  try {
    const guest = await Guest.findOneAndDelete({ _id: id, weddingId });
    if (!guest) return res.status(404).json({ message: 'Guest not found' });

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'DELETE_GUEST',
      details: `Removed guest: "${guest.name}"`
    });
    await activity.save();

    broadcastUpdate('guest_change', { action: 'delete', id });
    broadcastUpdate('activity_change', activity);
    res.json({ message: 'Guest deleted successfully', id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
