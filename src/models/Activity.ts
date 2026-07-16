import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  weddingId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  action: string;
  details: string;
  createdAt: Date;
}

const ActivitySchema: Schema = new Schema({
  weddingId: { type: Schema.Types.ObjectId, ref: 'Wedding', index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IActivity>('Activity', ActivitySchema);
