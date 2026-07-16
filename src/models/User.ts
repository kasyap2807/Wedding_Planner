import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'webadmin' | 'admin' | 'family' | 'volunteer';
  weddingId?: mongoose.Types.ObjectId;
  phone?: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['webadmin', 'admin', 'family', 'volunteer'], default: 'volunteer' },
  weddingId: { type: Schema.Types.ObjectId, ref: 'Wedding', index: true },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
