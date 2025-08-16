import Broadcast from "../models/broadcastModel.js";

// Controller to create a new broadcast (Admin only)
export const createBroadcast = async (req, res) => {
    const { title, content, recipient, messageType, sender } = req.body;
  try {
    if(!sender ){
        console.log('SenderId required')
    }
    const newBroadcast = new Broadcast({
      title,
      content,
      recipient,
      messageType,
      sender,
    });
    await newBroadcast.save();
    res.status(201).json({ message: 'Broadcast created successfully!', broadcast: newBroadcast });
  } catch (error) {
    res.status(500).json({ message: 'Error creating broadcast', error });
  }
};

// Controller for an Admin to view all broadcasts
export const getAdminBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find().sort({ timestamp: -1 });
    res.status(200).json(broadcasts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin broadcasts', error });
  }
};

// Controller for an Organizer to view relevant broadcasts
export const getOrganizerBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find({
      recipient: { $in: ['all', 'organizers'] }
    }).sort({ timestamp: -1 });
    res.status(200).json(broadcasts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizer broadcasts', error });
  }
};

// Controller for a regular User to view relevant broadcasts
export const getUserBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find({ recipient: 'all' }).sort({ timestamp: -1 });
    res.status(200).json(broadcasts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user broadcasts', error });
  }
};

// New function to get the count of unread broadcasts for a user
export const getUnreadBroadcastsCount = async (req, res) => {
  const userId = req.user._id; // Assuming you get the userId from your auth middleware
  try {
    const unreadCount = await Broadcast.countDocuments({
      recipient: { $in: ['all', 'organizers', 'single'] }, // Adjust recipients as needed
      readBy: { $nin: [userId] } // Count broadcasts where the user's ID is not in the readBy array
    });
    res.status(200).json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread broadcast count', error });
  }
};

// New function to mark a broadcast as read by a user
export const markBroadcastAsRead = async (req, res) => {
  const { broadcastId } = req.params;
  const userId = req.user._id;

  try {
    const broadcast = await Broadcast.findById(broadcastId);
    if (!broadcast) {
      return res.status(404).json({ message: "Broadcast not found" });
    }
    // Check if the user has already read the broadcast to avoid duplicate entries
    if (!broadcast.readBy.includes(userId)) {
      broadcast.readBy.push(userId);
      await broadcast.save();
    }
    res.status(200).json({ message: "Broadcast marked as read" });
  } catch (error) {
    res.status(500).json({ message: 'Error marking broadcast as read', error });
  }
};