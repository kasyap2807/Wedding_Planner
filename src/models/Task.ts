import mongoose, { Schema, Document } from 'mongoose';

export interface IChecklistItem {
  text: string;
  completed: boolean;
}

export interface IComment {
  userId: mongoose.Types.ObjectId;
  userName: string;
  text: string;
  createdAt: Date;
}

export interface ITask extends Document {
  weddingId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  eventId: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId[];
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  dueDate: Date;
  status: 'Not Started' | 'In Progress' | 'Waiting' | 'Blocked' | 'Completed' | 'Cancelled';
  checklist: IChecklistItem[];
  comments: IComment[];
  completionPercentage: number;
  createdAt: Date;
}

const ChecklistItemSchema = new Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const CommentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const TaskSchema: Schema = new Schema({
  weddingId: { type: Schema.Types.ObjectId, ref: 'Wedding', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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
TaskSchema.pre('save', function(next) {
  const task = this as any;
  if (task.status === 'Completed') {
    task.completionPercentage = 100;
  } else if (task.checklist && task.checklist.length > 0) {
    const completedCount = task.checklist.filter((item: any) => item.completed).length;
    task.completionPercentage = Math.round((completedCount / task.checklist.length) * 100);
  } else {
    task.completionPercentage = 0;
  }
  next();
});

export default mongoose.model<ITask>('Task', TaskSchema);
