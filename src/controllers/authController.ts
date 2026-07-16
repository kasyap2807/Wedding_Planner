import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Wedding from '../models/Wedding';
import Event from '../models/Event';
import { AuthRequest, getWeddingId } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'wedding_planner_secret_key_12345_super_secure_98765';

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role, phone } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Automatically create a new Wedding Workspace for self-signed admins
    let weddingId = undefined;
    const userRole = role || 'admin';

    if (userRole !== 'webadmin') {
      const wedding = new Wedding({
        name: `${name}'s Wedding`,
        date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year from now
        code: `wedding-${Date.now()}`
      });
      await wedding.save();
      weddingId = wedding._id;

      // Seed the 4 default sub-events for this wedding workspace
      const weddingDate = wedding.date;
      const dayMs = 24 * 60 * 60 * 1000;

      const defaultEvents = [
        {
          weddingId: wedding._id,
          name: 'Mehendi Ceremony',
          date: new Date(weddingDate.getTime() - 2 * dayMs),
          themeColor: 'mehendi',
          description: 'Traditional henna and music night',
          location: 'Grand Lawn Poolside',
          budget: 150000
        },
        {
          weddingId: wedding._id,
          name: 'Haldi Ceremony',
          date: new Date(weddingDate.getTime() - 1 * dayMs),
          themeColor: 'haldi',
          description: 'Festive marigold-themed haldi ceremony',
          location: 'Terrace Garden',
          budget: 100000
        },
        {
          weddingId: wedding._id,
          name: 'Wedding Ceremony',
          date: weddingDate,
          themeColor: 'wedding',
          description: 'Main wedding ceremony celebrations',
          location: 'Royal Ballroom',
          budget: 500000
        },
        {
          weddingId: wedding._id,
          name: 'Grand Reception',
          date: new Date(weddingDate.getTime() + 1 * dayMs),
          themeColor: 'reception',
          description: 'Post-wedding celebrations and grand dinner',
          location: 'Grand Exhibition Hall',
          budget: 400000
        }
      ];

      await Event.insertMany(defaultEvents);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      passwordHash,
      role: userRole,
      weddingId,
      phone
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email, weddingId: user.weddingId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        weddingId: user.weddingId,
        phone: user.phone
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email, weddingId: user.weddingId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        weddingId: user.weddingId,
        phone: user.phone
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  const weddingId = getWeddingId(req);
  try {
    // Standard users only see users inside their own wedding workspace
    const filter = req.user?.role === 'webadmin' ? {} : { weddingId };
    const users = await User.find(filter).select('-passwordHash');
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const weddingId = getWeddingId(req);

  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'webadmin') {
      return res.status(403).json({ message: 'Only admins can change roles' });
    }

    // Standard admins can only update users in their own wedding workspace
    const filter = req.user?.role === 'webadmin' ? { _id: id } : { _id: id, weddingId };
    const user = await User.findOneAndUpdate(filter, { role }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found or access denied' });

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
