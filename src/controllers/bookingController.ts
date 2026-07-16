import { Response } from 'express';
import Booking from '../models/Booking';
import { AuthRequest, getWeddingId } from '../middleware/auth';
import { broadcastUpdate } from '../socket';
import Activity from '../models/Activity';

export const getBookings = async (req: AuthRequest, res: Response) => {
  const weddingId = getWeddingId(req);
  try {
    const bookings = await Booking.find({ weddingId }).populate('eventId', 'name themeColor').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createBooking = async (req: AuthRequest, res: Response) => {
  const {
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
  } = req.body;
  const weddingId = getWeddingId(req);

  try {
    if (!weddingId) {
      return res.status(400).json({ message: 'Wedding workspace ID is required' });
    }

    if (req.user?.role !== 'admin' && req.user?.role !== 'family' && req.user?.role !== 'webadmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const booking = new Booking({
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

    const populatedBooking = await Booking.findOne({ _id: booking._id, weddingId }).populate('eventId', 'name themeColor');

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'CREATE_BOOKING',
      details: `Created vendor booking with "${booking.vendorName}" (${booking.category})`
    });
    await activity.save();

    broadcastUpdate('booking_change', { action: 'create', booking: populatedBooking });
    broadcastUpdate('activity_change', activity);
    res.status(201).json(populatedBooking);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBooking = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
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
  } = req.body;
  const weddingId = getWeddingId(req);

  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'family' && req.user?.role !== 'webadmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: id, weddingId },
      {
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
      },
      { new: true }
    ).populate('eventId', 'name themeColor');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'UPDATE_BOOKING',
      details: `Updated booking for "${booking.vendorName}" (Status: ${booking.bookingStatus})`
    });
    await activity.save();

    broadcastUpdate('booking_change', { action: 'update', booking });
    broadcastUpdate('activity_change', activity);
    res.json(booking);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBooking = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const weddingId = getWeddingId(req);

  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'webadmin') {
      return res.status(403).json({ message: 'Only admins can delete bookings' });
    }

    const booking = await Booking.findOneAndDelete({ _id: id, weddingId });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'DELETE_BOOKING',
      details: `Removed booking for "${booking.vendorName}"`
    });
    await activity.save();

    broadcastUpdate('booking_change', { action: 'delete', id });
    broadcastUpdate('activity_change', activity);
    res.json({ message: 'Booking removed successfully', id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
