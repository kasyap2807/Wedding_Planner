import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { initSocket } from './socket';
import { authenticateToken, requireRole } from './middleware/auth';

// Controller imports
import * as authController from './controllers/authController';
import * as eventController from './controllers/eventController';
import * as taskController from './controllers/taskController';
import * as guestController from './controllers/guestController';
import * as bookingController from './controllers/bookingController';
import * as shoppingController from './controllers/shoppingController';
import * as dashboardController from './controllers/dashboardController';
import * as weddingController from './controllers/weddingController';

const app = express();
const server = http.createServer(app);

// Configurations
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wedding_planner';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// CORS configuration
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Socket.io initialization
initSocket(server, [FRONTEND_URL, 'http://localhost:3000']);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB database'))
  .catch((err) => console.error('MongoDB database connection error:', err));

// Routes

// 1. Auth & Users API
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/profile', authenticateToken, authController.getProfile);
app.get('/api/auth/users', authenticateToken, authController.getAllUsers);
app.patch('/api/auth/users/:id/role', authenticateToken, requireRole(['admin']), authController.updateUserRole);

// 2. Events API
app.get('/api/events', authenticateToken, eventController.getEvents);
app.get('/api/events/:id', authenticateToken, eventController.getEventById);
app.post('/api/events', authenticateToken, requireRole(['admin', 'family']), eventController.createEvent);
app.put('/api/events/:id', authenticateToken, requireRole(['admin', 'family']), eventController.updateEvent);
app.delete('/api/events/:id', authenticateToken, requireRole(['admin']), eventController.deleteEvent);

// 3. Tasks API
app.get('/api/tasks', authenticateToken, taskController.getTasks);
app.post('/api/tasks', authenticateToken, requireRole(['admin', 'family']), taskController.createTask);
app.put('/api/tasks/:id', authenticateToken, taskController.updateTask);
app.delete('/api/tasks/:id', authenticateToken, requireRole(['admin', 'family']), taskController.deleteTask);
app.post('/api/tasks/:id/comments', authenticateToken, taskController.addComment);

// 4. Guest API
app.get('/api/guests', authenticateToken, guestController.getGuests);
app.post('/api/guests', authenticateToken, requireRole(['admin', 'family']), guestController.createGuest);
app.put('/api/guests/:id', authenticateToken, guestController.updateGuest);
app.delete('/api/guests/:id', authenticateToken, requireRole(['admin', 'family']), guestController.deleteGuest);

// 5. Vendor Bookings API
app.get('/api/bookings', authenticateToken, bookingController.getBookings);
app.post('/api/bookings', authenticateToken, requireRole(['admin', 'family']), bookingController.createBooking);
app.put('/api/bookings/:id', authenticateToken, requireRole(['admin', 'family']), bookingController.updateBooking);
app.delete('/api/bookings/:id', authenticateToken, requireRole(['admin']), bookingController.deleteBooking);

// 6. Shopping Planner API
app.get('/api/shopping', authenticateToken, shoppingController.getShoppingItems);
app.post('/api/shopping', authenticateToken, shoppingController.createShoppingItem);
app.put('/api/shopping/:id', authenticateToken, shoppingController.updateShoppingItem);
app.delete('/api/shopping/:id', authenticateToken, requireRole(['admin', 'family']), shoppingController.deleteShoppingItem);

// 7. Dashboard API
app.get('/api/dashboard/stats', authenticateToken, dashboardController.getDashboardStats);

// 8. Weddings API (Webadmin ONLY)
app.get('/api/weddings', authenticateToken, requireRole(['webadmin']), weddingController.getWeddings);
app.post('/api/weddings', authenticateToken, requireRole(['webadmin']), weddingController.createWedding);
app.post('/api/weddings/:id/users', authenticateToken, requireRole(['webadmin']), weddingController.createWeddingUser);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Express API Server listening on port ${PORT}`);
});
