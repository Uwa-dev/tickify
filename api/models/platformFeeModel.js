import mongoose from "mongoose";

const platformFeeSchema = new mongoose.Schema(
  {
    feePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 3.0, // Default fee
    },
  },
  { timestamps: true }
);

const PlatformFee = mongoose.model("PlatformFee", platformFeeSchema);

export default PlatformFee;