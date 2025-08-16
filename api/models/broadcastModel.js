import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  recipient: {
    type: String,
    enum: ['all', 'organizers', 'birthday', 'single'],
    required: true,
  },
  messageType: {
    type: String,
    enum: ['announcement', 'greeting', 'eventSuccess', 'personalized'],
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
});

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

export default Broadcast;