import mongoose, { Schema, Document } from 'mongoose';

export interface IShoppingItem extends Document {
  weddingId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  budget: number;
  actualPrice: number;
  store?: string;
  status: 'Pending' | 'Purchased';
  assignedTo?: mongoose.Types.ObjectId;
  receiptUrl?: string;
  category: string;
  eventId?: mongoose.Types.ObjectId; // Event associated
  createdAt: Date;
}

const ShoppingItemSchema: Schema = new Schema({
  weddingId: { type: Schema.Types.ObjectId, ref: 'Wedding', required: true, index: true },
  name: { type: String, required: true },
  quantity: { type: Number, default: 1, required: true },
  budget: { type: Number, default: 0, required: true },
  actualPrice: { type: Number, default: 0 },
  store: { type: String },
  status: { type: String, enum: ['Pending', 'Purchased'], default: 'Pending' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  receiptUrl: { type: String },
  category: { type: String, required: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IShoppingItem>('ShoppingItem', ShoppingItemSchema);
