import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  name: string;
  phone: string;
  category: string;
  email?: string;
  rating: number;
  notes?: string;
  createdAt: Date;
}

const VendorSchema: Schema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  category: { type: String, required: true },
  email: { type: String },
  rating: { type: Number, default: 5 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IVendor>('Vendor', VendorSchema);
