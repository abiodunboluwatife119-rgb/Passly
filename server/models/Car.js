import mongoose from 'mongoose';

const carSchema = new mongoose.Schema(
  {
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    location: { type: String, required: true },
    images: [{ type: String }],
    transmission: {
      type: String,
      enum: ['automatic', 'manual'],
      required: true,
    },
    seats: { type: Number, required: true },
    available: { type: Boolean, default: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Car = mongoose.model('Car', carSchema);

export default Car;