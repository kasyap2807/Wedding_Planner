import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import Wedding from '../models/Wedding';
import User from '../models/User';
import Event from '../models/Event';
import { sendWelcomeEmail } from '../utils/mailer';

export const getWeddings = async (req: AuthRequest, res: Response) => {
  try {
    const weddings = await Wedding.find().sort({ date: 1 });
    res.json(weddings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createWedding = async (req: AuthRequest, res: Response) => {
  const { name, date, code, ideology, customEvents } = req.body;

  try {
    // Check if code is already taken
    const existingWedding = await Wedding.findOne({ code });
    if (existingWedding) {
      return res.status(400).json({ message: 'Wedding code (slug) is already taken.' });
    }

    const wedding = new Wedding({
      name,
      date: new Date(date),
      code,
      ideology: ideology || 'general'
    });

    await wedding.save();

    // Automatically seed default events (functions) for this wedding workspace
    const weddingDate = new Date(date);
    const dayMs = 24 * 60 * 60 * 1000;

    let defaultEvents: any[] = [];
    const chosenIdeology = ideology || 'general';

    if (Array.isArray(customEvents) && customEvents.length > 0) {
      defaultEvents = customEvents.map((evtName: string, index: number) => {
        const offsetDays = customEvents.length - 1 - index;
        const themeOption = index === 0 ? 'mehendi' : index === 1 ? 'haldi' : index === 2 ? 'wedding' : 'reception';
        return {
          weddingId: wedding._id,
          name: evtName.trim(),
          date: new Date(weddingDate.getTime() - offsetDays * dayMs),
          themeColor: themeOption,
          description: `Custom celebratory sub-event: ${evtName}`,
          location: 'Grand Ballroom',
          budget: Math.round(1000000 / customEvents.length)
        };
      });
    } else if (chosenIdeology === 'muslim') {
      defaultEvents = [
        {
          weddingId: wedding._id,
          name: 'Mehendi Ceremony',
          date: new Date(weddingDate.getTime() - 2 * dayMs),
          themeColor: 'mehendi',
          description: 'Traditional henna and music night celebrations',
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
          name: 'Nikah Ceremony',
          date: weddingDate,
          themeColor: 'wedding',
          description: 'Main wedding contract signing and vows',
          location: 'Royal Ballroom',
          budget: 500000
        },
        {
          weddingId: wedding._id,
          name: 'Walima Reception',
          date: new Date(weddingDate.getTime() + 1 * dayMs),
          themeColor: 'reception',
          description: 'Post-wedding celebratory dinner feast',
          location: 'Grand Exhibition Hall',
          budget: 400000
        }
      ];
    } else if (chosenIdeology === 'hindu') {
      defaultEvents = [
        {
          weddingId: wedding._id,
          name: 'Sangeet Ceremony',
          date: new Date(weddingDate.getTime() - 2 * dayMs),
          themeColor: 'mehendi',
          description: 'Traditional musical and dance evening celebration',
          location: 'Grand Lawn Poolside',
          budget: 150000
        },
        {
          weddingId: wedding._id,
          name: 'Haldi Ceremony',
          date: new Date(weddingDate.getTime() - 1 * dayMs),
          themeColor: 'haldi',
          description: 'Auspicious marigold turmeric ceremony',
          location: 'Terrace Garden',
          budget: 100000
        },
        {
          weddingId: wedding._id,
          name: 'Shaadi Ceremony',
          date: weddingDate,
          themeColor: 'wedding',
          description: 'Main wedding ceremony and pheras',
          location: 'Royal Ballroom',
          budget: 500000
        },
        {
          weddingId: wedding._id,
          name: 'Reception Party',
          date: new Date(weddingDate.getTime() + 1 * dayMs),
          themeColor: 'reception',
          description: 'Grand reception celebration dinner',
          location: 'Grand Exhibition Hall',
          budget: 400000
        }
      ];
    } else if (chosenIdeology === 'western') {
      defaultEvents = [
        {
          weddingId: wedding._id,
          name: 'Welcome Dinner',
          date: new Date(weddingDate.getTime() - 2 * dayMs),
          themeColor: 'mehendi',
          description: 'Informal social gathering for family and out-of-town guests',
          location: 'Grand Lawn Poolside',
          budget: 150000
        },
        {
          weddingId: wedding._id,
          name: 'Rehearsal Dinner',
          date: new Date(weddingDate.getTime() - 1 * dayMs),
          themeColor: 'haldi',
          description: 'Pre-wedding run-through and intimate toast dinner',
          location: 'Terrace Garden',
          budget: 100000
        },
        {
          weddingId: wedding._id,
          name: 'Wedding Ceremony',
          date: weddingDate,
          themeColor: 'wedding',
          description: 'Formal exchange of vows and rings',
          location: 'Royal Ballroom',
          budget: 500000
        },
        {
          weddingId: wedding._id,
          name: 'Wedding Reception',
          date: new Date(weddingDate.getTime() + 1 * dayMs),
          themeColor: 'reception',
          description: 'Banquet dinner, toasts, and dancing celebration',
          location: 'Grand Exhibition Hall',
          budget: 400000
        }
      ];
    } else {
      defaultEvents = [
        {
          weddingId: wedding._id,
          name: 'Mehendi Ceremony',
          date: new Date(weddingDate.getTime() - 2 * dayMs),
          themeColor: 'mehendi',
          description: 'Henna application and traditional songs',
          location: 'Grand Lawn Poolside',
          budget: 150000
        },
        {
          weddingId: wedding._id,
          name: 'Haldi Ceremony',
          date: new Date(weddingDate.getTime() - 1 * dayMs),
          themeColor: 'haldi',
          description: 'Marigold yellow haldi custom party',
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
          description: 'Celebratory wedding reception feast',
          location: 'Grand Exhibition Hall',
          budget: 400000
        }
      ];
    }

    await Event.insertMany(defaultEvents);

    res.status(201).json(wedding);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createWeddingUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // Wedding ID
  const { name, email, password, role, phone } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const wedding = await Wedding.findById(id);
    if (!wedding) {
      return res.status(404).json({ message: 'Wedding workspace not found' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      passwordHash,
      role,
      weddingId: wedding._id,
      phone
    });

    await user.save();

    // Send welcome email notification containing temporary password and workspace credentials
    await sendWelcomeEmail(email, name, role, wedding.name, password);

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      weddingId: user.weddingId,
      phone: user.phone
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
