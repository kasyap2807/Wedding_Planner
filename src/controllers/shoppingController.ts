import { Response } from 'express';
import ShoppingItem from '../models/ShoppingItem';
import { AuthRequest, getWeddingId } from '../middleware/auth';
import { broadcastUpdate } from '../socket';
import Activity from '../models/Activity';

export const getShoppingItems = async (req: AuthRequest, res: Response) => {
  const weddingId = getWeddingId(req);
  try {
    const items = await ShoppingItem.find({ weddingId })
      .populate('assignedTo', 'name email role phone')
      .populate('eventId', 'name themeColor')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createShoppingItem = async (req: AuthRequest, res: Response) => {
  const { name, quantity, budget, actualPrice, store, status, assignedTo, category, eventId, receiptUrl } = req.body;
  const weddingId = getWeddingId(req);

  try {
    if (!weddingId) {
      return res.status(400).json({ message: 'Wedding workspace ID is required' });
    }

    const item = new ShoppingItem({
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

    const populatedItem = await ShoppingItem.findOne({ _id: item._id, weddingId })
      .populate('assignedTo', 'name email role phone')
      .populate('eventId', 'name themeColor');

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'ADD_SHOPPING_ITEM',
      details: `Added shopping item: "${item.name}" (Category: ${item.category})`
    });
    await activity.save();

    broadcastUpdate('shopping_change', { action: 'create', item: populatedItem });
    broadcastUpdate('activity_change', activity);
    res.status(201).json(populatedItem);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateShoppingItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, quantity, budget, actualPrice, store, status, assignedTo, category, eventId, receiptUrl } = req.body;
  const weddingId = getWeddingId(req);

  try {
    const item = await ShoppingItem.findOne({ _id: id, weddingId });
    if (!item) return res.status(404).json({ message: 'Shopping item not found' });

    if (name !== undefined) item.name = name;
    if (quantity !== undefined) item.quantity = quantity;
    if (budget !== undefined) item.budget = budget;
    if (actualPrice !== undefined) item.actualPrice = actualPrice;
    if (store !== undefined) item.store = store;
    if (status !== undefined) item.status = status;
    if (assignedTo !== undefined) item.assignedTo = assignedTo;
    if (category !== undefined) item.category = category;
    if (eventId !== undefined) item.eventId = eventId;
    if (receiptUrl !== undefined) item.receiptUrl = receiptUrl;

    await item.save();

    const populatedItem = await ShoppingItem.findOne({ _id: item._id, weddingId })
      .populate('assignedTo', 'name email role phone')
      .populate('eventId', 'name themeColor');

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'User',
      action: 'UPDATE_SHOPPING_ITEM',
      details: `Updated shopping item "${item.name}" (Status: ${item.status})`
    });
    await activity.save();

    broadcastUpdate('shopping_change', { action: 'update', item: populatedItem });
    broadcastUpdate('activity_change', activity);
    res.json(populatedItem);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteShoppingItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const weddingId = getWeddingId(req);

  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'family' && req.user?.role !== 'webadmin') {
      return res.status(403).json({ message: 'Unauthorized to delete items' });
    }

    const item = await ShoppingItem.findOneAndDelete({ _id: id, weddingId });
    if (!item) return res.status(404).json({ message: 'Shopping item not found' });

    // Log activity
    const activity = new Activity({
      weddingId,
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'DELETE_SHOPPING_ITEM',
      details: `Removed shopping item: "${item.name}"`
    });
    await activity.save();

    broadcastUpdate('shopping_change', { action: 'delete', id });
    broadcastUpdate('activity_change', activity);
    res.json({ message: 'Shopping item deleted successfully', id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
