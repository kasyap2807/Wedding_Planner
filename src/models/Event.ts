import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  weddingId: mongoose.Types.ObjectId;
  name: string;
  date: Date;
  themeColor: string; // 'mehendi' | 'haldi' | 'nikah' | 'reception' | 'custom'
  description?: string;
  location?: string;
  budget: number;
  status: 'active' | 'archived';
  createdAt: Date;
}

const EventSchema: Schema = new Schema({
  weddingId: { type: Schema.Types.ObjectId, ref: 'Wedding', required: true, index: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  themeColor: { type: String, required: true, default: 'custom' },
  description: { type: String },
  location: { type: String },
  budget: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IEvent>('Event', EventSchema);
