import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import User from './models/User';
import Wedding from './models/Wedding';
import Event from './models/Event';
import Task from './models/Task';
import Guest from './models/Guest';
import Booking from './models/Booking';
import ShoppingItem from './models/ShoppingItem';
import Activity from './models/Activity';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wedding_planner';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected. Clearing database...');
    
    await Wedding.deleteMany({});
    await User.deleteMany({});
    await Event.deleteMany({});
    await Task.deleteMany({});
    await Guest.deleteMany({});
    await Booking.deleteMany({});
    await ShoppingItem.deleteMany({});
    await Activity.deleteMany({});
    
    console.log('Database cleared. Seeding default wedding workspace...');

    // 1. Create Default Wedding Workspace
    const defaultWedding = await Wedding.create({
      name: "Zara & Kabir's Wedding",
      date: new Date('2027-01-15T11:00:00Z'),
      code: 'zara-kabir',
      status: 'active'
    });

    console.log('Default wedding created. Seeding users...');
    
    // 2. Create Users
    const webadminPasswordHash = await bcrypt.hash('admin123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const familyPasswordHash = await bcrypt.hash('family123', 10);
    const volunteerPasswordHash = await bcrypt.hash('volunteer123', 10);
    
    // Platform Super Admin
    const webadmin = await User.create({
      name: 'Platform Superadmin',
      email: 'webadmin@wedding.com',
      passwordHash: webadminPasswordHash,
      role: 'webadmin',
      phone: '+919999999999'
    });

    // Workspace specific users
    const admin = await User.create({
      weddingId: defaultWedding._id,
      name: 'Zara Malik',
      email: 'admin@wedding.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      phone: '+919876543210'
    });
    
    const family = await User.create({
      weddingId: defaultWedding._id,
      name: 'Kabir Ahmed',
      email: 'family@wedding.com',
      passwordHash: familyPasswordHash,
      role: 'family',
      phone: '+919876543211'
    });
    
    const volunteer = await User.create({
      weddingId: defaultWedding._id,
      name: 'Rahul Sharma',
      email: 'volunteer@wedding.com',
      passwordHash: volunteerPasswordHash,
      role: 'volunteer',
      phone: '+919876543212'
    });
    
    console.log('Users seeded. Seeding events...');
    
    // Wedding Date: January 15, 2027
    const mehendiDate = new Date('2027-01-13T16:00:00Z');
    const haldiDate = new Date('2027-01-14T10:00:00Z');
    const nikahDate = new Date('2027-01-15T11:00:00Z');
    const receptionDate = new Date('2027-01-16T19:00:00Z');
    
    const mehendiEvent = await Event.create({
      weddingId: defaultWedding._id,
      name: 'Mehendi Ceremony',
      date: mehendiDate,
      themeColor: 'mehendi',
      description: 'Traditional henna and music night',
      location: 'Grand Lawn, The Oberoi',
      budget: 150000
    });
    
    const haldiEvent = await Event.create({
      weddingId: defaultWedding._id,
      name: 'Haldi Ceremony',
      date: haldiDate,
      themeColor: 'haldi',
      description: 'Festive marigold-themed haldi ceremony',
      location: 'Poolside Terrace, The Oberoi',
      budget: 100000
    });
    
    const nikahEvent = await Event.create({
      weddingId: defaultWedding._id,
      name: 'Wedding Ceremony',
      date: nikahDate,
      themeColor: 'wedding',
      description: 'The main marriage ceremony celebrations',
      location: 'Royal Ballroom, The Oberoi',
      budget: 500000
    });
    
    const receptionEvent = await Event.create({
      weddingId: defaultWedding._id,
      name: 'Grand Reception',
      date: receptionDate,
      themeColor: 'reception',
      description: 'Formal celebration and wedding reception feast',
      location: 'Grand Ballroom, The Oberoi',
      budget: 800000
    });
    
    console.log('Events seeded. Seeding tasks...');
    
    // Seed Tasks
    const tasks = [
      // Mehendi tasks
      {
        weddingId: defaultWedding._id,
        name: 'Select Mehendi Designs',
        description: 'Finalize bridal and guest henna designs',
        category: 'Mehendi Artist',
        eventId: mehendiEvent._id,
        assignedTo: [volunteer._id],
        priority: 'Medium',
        dueDate: new Date('2026-11-20'),
        status: 'Not Started',
        checklist: [
          { text: 'Look up Pinterest boards', completed: false },
          { text: 'Finalize packages for bridesmaids', completed: false }
        ]
      },
      {
        weddingId: defaultWedding._id,
        name: 'Hire Dhol & Sound System',
        description: 'Book the traditional dhol players and speakers for music',
        category: 'DJ / Sound',
        eventId: mehendiEvent._id,
        assignedTo: [family._id],
        priority: 'High',
        dueDate: new Date('2026-10-15'),
        status: 'In Progress',
        checklist: [
          { text: 'Call DJ Sunny', completed: true },
          { text: 'Confirm invoice details', completed: false }
        ]
      },
      // Haldi tasks
      {
        weddingId: defaultWedding._id,
        name: 'Procure Haldi Paste Ingredients',
        description: 'Get high quality organic turmeric, sandalwood and rosewater',
        category: 'Others',
        eventId: haldiEvent._id,
        assignedTo: [volunteer._id],
        priority: 'Low',
        dueDate: new Date('2027-01-10'),
        status: 'Not Started',
        checklist: []
      },
      {
        weddingId: defaultWedding._id,
        name: 'Coordinate Yellow Dress Code',
        description: 'Send reminder to family members about wearing yellow/marigold colors',
        category: 'Others',
        eventId: haldiEvent._id,
        assignedTo: [family._id],
        priority: 'Medium',
        dueDate: new Date('2026-12-01'),
        status: 'Completed',
        checklist: [
          { text: 'Create WhatsApp broadcast group', completed: true },
          { text: 'Draft message and send template', completed: true }
        ]
      },
      // Nikah tasks
      {
        weddingId: defaultWedding._id,
        name: 'Sign Venue Contract',
        description: 'Finalize contract and pay advance deposit to The Oberoi',
        category: 'Venue',
        eventId: nikahEvent._id,
        assignedTo: [admin._id],
        priority: 'Critical',
        dueDate: new Date('2026-08-01'),
        status: 'Completed',
        checklist: [
          { text: 'Review terms with lawyer', completed: true },
          { text: 'Make payment transfer', completed: true }
        ]
      },
      {
        weddingId: defaultWedding._id,
        name: 'Finalize Wedding Menu',
        description: 'Approve final food menu list with Oberoi chef',
        category: 'Food Catering',
        eventId: nikahEvent._id,
        assignedTo: [admin._id, family._id],
        priority: 'High',
        dueDate: new Date('2026-09-10'),
        status: 'Waiting',
        checklist: [
          { text: 'Do tasting session', completed: true },
          { text: 'Decide dessert list (Gulab Jamun vs Rabdi)', completed: false }
        ]
      },
      {
        weddingId: defaultWedding._id,
        name: 'Order Invitations',
        description: 'Print physical cards and create e-invites',
        category: 'Invitation Cards Printing',
        eventId: nikahEvent._id,
        assignedTo: [family._id],
        priority: 'High',
        dueDate: new Date('2026-08-15'),
        status: 'In Progress',
        checklist: [
          { text: 'Design proof approval', completed: true },
          { text: 'Print 200 copies', completed: false },
          { text: 'Finalize digital invite card PDF', completed: false }
        ]
      },
      // Reception tasks
      {
        weddingId: defaultWedding._id,
        name: 'Trial Fitting: Reception Tux & Gown',
        description: 'First tailoring trial for the reception outfits',
        category: 'Wedding Clothes / Tailor',
        eventId: receptionEvent._id,
        assignedTo: [admin._id],
        priority: 'High',
        dueDate: new Date('2026-10-30'),
        status: 'Not Started',
        checklist: []
      }
    ];
    
    for (const t of tasks) {
      await Task.create(t);
    }
    
    console.log('Tasks seeded. Seeding guests...');
    
    // Seed Guests
    const guests = [
      { weddingId: defaultWedding._id, name: 'Sameer Malik', relation: 'Family', side: 'Bride', rsvpStatus: 'Attending', invitationSent: true, foodPreference: 'Non-Veg', phone: '+919999999901', email: 'sameer@wedding.com', notes: 'Bride\'s Uncle' },
      { weddingId: defaultWedding._id, name: 'Mariam Malik', relation: 'Family', side: 'Bride', rsvpStatus: 'Attending', invitationSent: true, foodPreference: 'Veg', phone: '+919999999902', email: 'mariam@wedding.com', notes: 'Bride\'s Aunt' },
      { weddingId: defaultWedding._id, name: 'Dr. Farooq Ahmed', relation: 'Family', side: 'Groom', rsvpStatus: 'Attending', invitationSent: true, foodPreference: 'Non-Veg', phone: '+919999999903', email: 'farooq@wedding.com', notes: 'Groom\'s Dad' },
      { weddingId: defaultWedding._id, name: 'Ayesha Ahmed', relation: 'Family', side: 'Groom', rsvpStatus: 'Attending', invitationSent: true, foodPreference: 'Non-Veg', phone: '+919999999904', email: 'ayesha@wedding.com', notes: 'Groom\'s Mom' },
      { weddingId: defaultWedding._id, name: 'Vikram Roy', relation: 'VIP', side: 'Groom', rsvpStatus: 'Tentative', invitationSent: true, foodPreference: 'Non-Veg', phone: '+919999999905', email: 'vikram@office.com', notes: 'Groom\'s CEO' },
      { weddingId: defaultWedding._id, name: 'Sneha Sen', relation: 'Friend', side: 'Bride', rsvpStatus: 'Attending', invitationSent: true, foodPreference: 'Vegan', phone: '+919999999906', email: 'sneha@gmail.com', notes: 'Maid of honor' },
      { weddingId: defaultWedding._id, name: 'Zayan Khan', relation: 'Friend', side: 'Groom', rsvpStatus: 'Pending', invitationSent: false, foodPreference: 'Any', phone: '+919999999907', email: 'zayan@gmail.com', notes: 'Best man' },
      { weddingId: defaultWedding._id, name: 'Saira Bano', relation: 'VIP', side: 'Bride', rsvpStatus: 'Pending', invitationSent: true, foodPreference: 'Veg', phone: '+919999999908', email: 'saira@gmail.com', notes: 'Grandmother' },
      { weddingId: defaultWedding._id, name: 'Aditya Gupta', relation: 'Friend', side: 'Bride', rsvpStatus: 'Not Attending', invitationSent: true, foodPreference: 'Any', phone: '+919999999909', email: 'aditya@gmail.com', notes: 'Out of country' }
    ];
    
    for (const g of guests) {
      await Guest.create(g);
    }
    
    console.log('Guests seeded. Seeding bookings...');
    
    // Seed Bookings (Venues, Decorators, Makeup Artists etc.)
    const bookings = [
      {
        weddingId: defaultWedding._id,
        vendorName: 'The Oberoi Grand Hotel',
        category: 'Venue',
        eventId: nikahEvent._id,
        bookingStatus: 'Confirmed',
        bookingDate: new Date('2026-06-20'),
        contractSigned: true,
        advancePaid: 200000,
        balanceDue: 300000,
        finalPaymentDueDate: new Date('2026-12-15'),
        contactPerson: 'Mr. David Paul',
        phone: '+919876000001',
        trialDate: new Date('2026-09-10'),
        notes: 'Includes catering and audio systems'
      },
      {
        weddingId: defaultWedding._id,
        vendorName: 'Signature Florals & Decor',
        category: 'Decoration',
        eventId: nikahEvent._id,
        bookingStatus: 'Booked',
        bookingDate: new Date('2026-07-05'),
        contractSigned: true,
        advancePaid: 50000,
        balanceDue: 150000,
        finalPaymentDueDate: new Date('2026-12-30'),
        contactPerson: 'Rohan Gupta',
        phone: '+919876000002',
        notes: 'White roses and gold curtain backdrop theme'
      },
      {
        weddingId: defaultWedding._id,
        vendorName: 'Nida Makeup Studio',
        category: 'Makeup Artist',
        eventId: nikahEvent._id,
        bookingStatus: 'Enquired',
        bookingDate: new Date('2026-07-10'),
        contractSigned: false,
        advancePaid: 0,
        balanceDue: 45000,
        contactPerson: 'Nida Khan',
        phone: '+919876000003',
        trialDate: new Date('2026-10-12'),
        notes: 'Waiting for makeup trial session before booking'
      },
      {
        weddingId: defaultWedding._id,
        vendorName: 'Kunal Rawal Studio',
        category: 'Wedding Clothes / Tailor',
        eventId: receptionEvent._id,
        bookingStatus: 'Negotiating',
        contractSigned: false,
        advancePaid: 0,
        balanceDue: 120000,
        contactPerson: 'Harshita Singh',
        phone: '+919876000004',
        fittingDates: [new Date('2026-10-15'), new Date('2026-11-20')],
        notes: 'Negotiating discount on sherwani matching reception dress code'
      },
      {
        weddingId: defaultWedding._id,
        vendorName: 'Light & Shade Photography',
        category: 'Photographer',
        eventId: nikahEvent._id,
        bookingStatus: 'Confirmed',
        bookingDate: new Date('2026-06-15'),
        contractSigned: true,
        advancePaid: 40000,
        balanceDue: 60000,
        finalPaymentDueDate: new Date('2027-01-20'),
        contactPerson: 'Amit Sen',
        phone: '+919876000005',
        notes: 'Traditional + Cinematic photography packages'
      },
      {
        weddingId: defaultWedding._id,
        vendorName: 'DJ Vicky India',
        category: 'DJ / Sound',
        bookingStatus: 'Not Booked',
        contractSigned: false,
        advancePaid: 0,
        balanceDue: 0,
        notes: 'Need to book ASAP - typical lead time 3-4 months out'
      }
    ];
    
    for (const b of bookings) {
      await Booking.create(b);
    }
    
    console.log('Bookings seeded. Seeding shopping list...');
    
    // Seed Shopping items
    const shoppingItems = [
      { weddingId: defaultWedding._id, name: 'Traditional Bridal Gold Necklace Set', quantity: 1, budget: 350000, actualPrice: 345000, store: 'Tanishq Jewellers', status: 'Purchased', category: 'Jewelry', eventId: nikahEvent._id, assignedTo: admin._id },
      { weddingId: defaultWedding._id, name: 'Mehendi Gota Patti bangles and floral accessories', quantity: 50, budget: 10000, actualPrice: 0, store: 'Sadar Bazar Wholesale', status: 'Pending', category: 'Jewelry', eventId: mehendiEvent._id, assignedTo: volunteer._id },
      { weddingId: defaultWedding._id, name: 'Yellow Silk Dupattas for Haldi backdrop', quantity: 20, budget: 5000, actualPrice: 4800, store: 'Karol Bagh Market', status: 'Purchased', category: 'Decorations', eventId: haldiEvent._id, assignedTo: family._id },
      { weddingId: defaultWedding._id, name: 'Red Wedding Sherwani for groom', quantity: 1, budget: 80000, actualPrice: 0, store: 'Manyavar', status: 'Pending', category: 'Clothes', eventId: nikahEvent._id, assignedTo: family._id },
      { weddingId: defaultWedding._id, name: 'Custom invitation sweet boxes', quantity: 200, budget: 40000, actualPrice: 0, store: 'Haldirams', status: 'Pending', category: 'Return Gifts', eventId: nikahEvent._id, assignedTo: family._id }
    ];
    
    for (const s of shoppingItems) {
      await ShoppingItem.create(s);
    }
    
    console.log('Shopping items seeded. Seeding initial activities...');
    
    // Seed Activity Log
    await Activity.create({
      weddingId: defaultWedding._id,
      userId: admin._id,
      userName: admin.name,
      action: 'SYSTEM_INIT',
      details: 'Wedding Planner initialized with 4 default workspace events.'
    });
    
    await Activity.create({
      weddingId: defaultWedding._id,
      userId: admin._id,
      userName: admin.name,
      action: 'CREATE_BOOKING',
      details: 'Booked venue "The Oberoi Grand Hotel" for Wedding Ceremony.'
    });
    
    await Activity.create({
      weddingId: defaultWedding._id,
      userId: family._id,
      userName: family.name,
      action: 'UPDATE_TASK',
      details: 'Completed task: "Coordinate Yellow Dress Code" for Haldi Ceremony.'
    });
    
    console.log('Database successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedData();
