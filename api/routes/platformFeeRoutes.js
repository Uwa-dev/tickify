import express from 'express';
import PlatformFee from '../models/platformFeeModel.js';
import { protect, admin } from '../utils/createToken.js';

const feeRouter = express.Router();


feeRouter.get('/platform-fee', protect, admin, async (req, res) => {
  try {
    // Find the single platform fee document, or create it if it doesn't exist
    let fee = await PlatformFee.findOne();
    if (!fee) {
      fee = await PlatformFee.create({ feePercentage: 3.0 }); // Create with default
    }
    res.status(200).json(fee);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


feeRouter.put('/platform-fee', protect, admin, async (req, res) => {
  const { newFeePercentage } = req.body;

  if (typeof newFeePercentage !== 'number' || newFeePercentage < 0 || newFeePercentage > 100) {
    return res.status(400).json({ message: 'Invalid fee percentage.' });
  }

  try {
    // Find the single platform fee document
    let fee = await PlatformFee.findOne();
    if (!fee) {
      // If it doesn't exist, create it.
      fee = await PlatformFee.create({ feePercentage: newFeePercentage });
      return res.status(201).json(fee);
    }

    // Update the existing document
    fee.feePercentage = newFeePercentage;
    await fee.save();

    res.status(200).json(fee);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default feeRouter;