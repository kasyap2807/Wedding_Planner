import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  weddingId: mongoose.Types.ObjectId;
  vendorName: string;
  category: string;
  eventId?: mongoose.Types.ObjectId; // Wedding function associated
  bookingStatus: 'Not Booked' | 'Enquired' | 'Negotiating' | 'Booked' | 'Confirmed' | 'Cancelled';
  bookingDate?: Date;
  contractSigned: boolean;
  advancePaid: number;
  balanceDue: number;
  finalPaymentDueDate?: Date;
  contactPerson?: string;
  phone?: string;
  trialDate?: Date;
  fittingDates?: Date[];
  notes?: string;
  contractUrl?: string;
  createdAt: Date;
}

const BookingSchema: Schema = new Schema({
  weddingId: { type: Schema.Types.ObjectId, ref: 'Wedding', required: true, index: true },
  vendorName: { type: String, required: true },
  category: { type: String, required: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  bookingStatus: { 
    type: String, 
    enum: ['Not Booked', 'Enquired', 'Negotiating', 'Booked', 'Confirmed', 'Cancelled'], 
    default: 'Not Booked' 
  },
  bookingDate: { type: Date },
  contractSigned: { type: Boolean, default: false },
  advancePaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  finalPaymentDueDate: { type: Date },
  contactPerson: { type: String },
  phone: { type: String },
  trialDate: { type: Date },
  fittingDates: [{ type: Date }],
  notes: { type: String },
  contractUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IBooking>('Booking', BookingSchema);
