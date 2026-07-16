import mongoose, { Schema, Document } from 'mongoose';

export interface IWedding extends Document {
  name: string;
  date: Date;
  code: string;
  status: 'active' | 'completed' | 'archived';
  ideology: string;
  createdAt: Date;
}

const WeddingSchema: Schema = new Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  code: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  ideology: { type: String, default: 'general' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IWedding>('Wedding', WeddingSchema);
