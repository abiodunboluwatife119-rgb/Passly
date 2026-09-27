import mongoose from 'mongoose';

const bookingItemSchema = new mongoose.Schema({
  refId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  meta: { type: mongoose.Schema.Types.Mixed },
});

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['event', 'car', 'food'],
      required: true,
    },
    items: [bookingItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'completed'],
      default: 'pending',
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    fulfillment: {
      type: String,
      enum: ['pickup', 'delivery'],
    },
    address: { type: String },
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;