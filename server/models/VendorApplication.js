import mongoose from 'mongoose';

const vendorApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true },
    businessType: {
      type: String,
      enum: ['event', 'car', 'restaurant'],
      required: true,
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

const VendorApplication = mongoose.model('VendorApplication', vendorApplicationSchema);

export default VendorApplication;