"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastUpdate = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initSocket = (server, allowedOrigins) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
exports.getIO = getIO;
const broadcastUpdate = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};
exports.broadcastUpdate = broadcastUpdate;
