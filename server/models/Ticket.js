import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['event', 'car', 'food'],
      required: true,
    },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    code: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['valid', 'used', 'cancelled'],
      default: 'valid',
    },
    usedAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;