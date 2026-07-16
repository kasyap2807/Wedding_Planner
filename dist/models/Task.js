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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ChecklistItemSchema = new mongoose_1.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }
});
const CommentSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const TaskSchema = new mongoose_1.Schema({
    weddingId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Wedding', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    eventId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    assignedTo: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
    dueDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Waiting', 'Blocked', 'Completed', 'Cancelled'],
        default: 'Not Started'
    },
    checklist: [ChecklistItemSchema],
    comments: [CommentSchema],
    completionPercentage: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
// Auto-calculate completion percentage before saving
TaskSchema.pre('save', function (next) {
    const task = this;
    if (task.status === 'Completed') {
        task.completionPercentage = 100;
    }
    else if (task.checklist && task.checklist.length > 0) {
        const completedCount = task.checklist.filter((item) => item.completed).length;
        task.completionPercentage = Math.round((completedCount / task.checklist.length) * 100);
    }
    else {
        task.completionPercentage = 0;
    }
    next();
});
exports.default = mongoose_1.default.model('Task', TaskSchema);
