"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const socket_1 = require("./socket");
const auth_1 = require("./middleware/auth");
// Controller imports
const authController = __importStar(require("./controllers/authController"));
const eventController = __importStar(require("./controllers/eventController"));
const taskController = __importStar(require("./controllers/taskController"));
const guestController = __importStar(require("./controllers/guestController"));
const bookingController = __importStar(require("./controllers/bookingController"));
const shoppingController = __importStar(require("./controllers/shoppingController"));
const dashboardController = __importStar(require("./controllers/dashboardController"));
const weddingController = __importStar(require("./controllers/weddingController"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Configurations
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wedding_planner';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
// CORS configuration
app.use((0, cors_1.default)({
    origin: [FRONTEND_URL, 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}));
app.use(express_1.default.json());
// Socket.io initialization
(0, socket_1.initSocket)(server, [FRONTEND_URL, 'http://localhost:3000']);
// Connect to MongoDB
mongoose_1.default.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB database'))
    .catch((err) => console.error('MongoDB database connection error:', err));
// Routes
// 1. Auth & Users API
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/profile', auth_1.authenticateToken, authController.getProfile);
app.get('/api/auth/users', auth_1.authenticateToken, authController.getAllUsers);
app.patch('/api/auth/users/:id/role', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), authController.updateUserRole);
// 2. Events API
app.get('/api/events', auth_1.authenticateToken, eventController.getEvents);
app.get('/api/events/:id', auth_1.authenticateToken, eventController.getEventById);
app.post('/api/events', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'family']), eventController.createEvent);
app.put('/api/events/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'family']), eventController.updateEvent);
app.delete('/api/events/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), eventController.deleteEvent);
// 3. Tasks API
app.get('/api/tasks', auth_1.authenticateToken, taskController.getTasks);
app.post('/api/tasks', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'family']), taskController.createTask);
app.put('/api/tasks/:id', auth_1.authenticateToken, taskController.updateTask);
app.delete('/api/tasks/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'family']), taskController.deleteTask);
app.post('/api/tasks/:id/comments', auth_1.authenticateToken, taskController.addComment);
// 4. Guest API
app.get('/api/guests', auth_1.authenticateToken, guestController.getGuests);
app.post('/api/guests', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'family']), guestController.createGuest);
app.put('/api/guests/:id', auth_1.authenticateToken, guestController.updateGuest);
app.delete('/api/guests/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'family']), guestController.deleteGuest);
// 5. Vendor Bookings API
app.get('/api/bookings', auth_1.authenticateToken, bookingController.getBookings);
app.post('/api/bookings', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'family']), bookingController.createBooking);
app.put('/api/bookings/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'family']), bookingController.updateBooking);
app.delete('/api/bookings/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), bookingController.deleteBooking);
// 6. Shopping Planner API
app.get('/api/shopping', auth_1.authenticateToken, shoppingController.getShoppingItems);
app.post('/api/shopping', auth_1.authenticateToken, shoppingController.createShoppingItem);
app.put('/api/shopping/:id', auth_1.authenticateToken, shoppingController.updateShoppingItem);
app.delete('/api/shopping/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'family']), shoppingController.deleteShoppingItem);
// 7. Dashboard API
app.get('/api/dashboard/stats', auth_1.authenticateToken, dashboardController.getDashboardStats);
// 8. Weddings API (Webadmin ONLY)
app.get('/api/weddings', auth_1.authenticateToken, (0, auth_1.requireRole)(['webadmin']), weddingController.getWeddings);
app.post('/api/weddings', auth_1.authenticateToken, (0, auth_1.requireRole)(['webadmin']), weddingController.createWedding);
app.post('/api/weddings/:id/users', auth_1.authenticateToken, (0, auth_1.requireRole)(['webadmin']), weddingController.createWeddingUser);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});
// Start Server
server.listen(PORT, () => {
    console.log(`Express API Server listening on port ${PORT}`);
});
