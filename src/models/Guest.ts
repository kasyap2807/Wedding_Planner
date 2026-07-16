import mongoose, { Schema, Document } from 'mongoose';

export interface IGuest extends Document {
  weddingId: mongoose.Types.ObjectId;
  name: string;
  relation: 'Family' | 'Friend' | 'VIP';
  side: 'Bride' | 'Groom';
  rsvpStatus: 'Attending' | 'Not Attending' | 'Tentative' | 'Pending';
  invitationSent: boolean;
  foodPreference: 'Veg' | 'Non-Veg' | 'Vegan' | 'Jain' | 'Any';
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: Date;
}

const GuestSchema: Schema = new Schema({
  weddingId: { type: Schema.Types.ObjectId, ref: 'Wedding', required: true, index: true },
  name: { type: String, required: true },
  relation: { type: String, enum: ['Family', 'Friend', 'VIP'], required: true },
  side: { type: String, enum: ['Bride', 'Groom'], required: true },
  rsvpStatus: { type: String, enum: ['Attending', 'Not Attending', 'Tentative', 'Pending'], default: 'Pending' },
  invitationSent: { type: Boolean, default: false },
  foodPreference: { type: String, enum: ['Veg', 'Non-Veg', 'Vegan', 'Jain', 'Any'], default: 'Any' },
  phone: { type: String },
  email: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IGuest>('Guest', GuestSchema);
