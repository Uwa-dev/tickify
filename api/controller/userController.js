import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import User from '../models/userModel.js';
import generateToken from '../utils/createToken.js';
import mongoose from 'mongoose';
import Event from "../models/eventModel.js";


// Register User
export const register = async (req, res) => {
  const { firstName, username, lastName, email, password, termsAccepted } = req.body;

  try {

    
    // Backend validation for terms of use
    if (!termsAccepted) {
      return res.status(400).json({
        message: 'You must agree to the terms of use and privacy policy to register.'
      });
    }

    // Input validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'All fields are required' 
      });
    }

    // Check if user exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ 
        message: 'User already exists' 
      });
    }

    // Validate inputs
    if (!validator.isEmail(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with terms of use acceptance
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      username: username || `user${Date.now()}`,
      termsAccepted: true, // Explicitly set to true since we validated it
      termsAcceptedAt: new Date() // Add a timestamp for the agreement
    });

    const token = generateToken(res, user._id, user.isAdmin);

    // Return response with a success message
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin || false
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error during registration'
    });
  }
};

// Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User does not exist' });
    }

    // Validate the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(res, user._id, user.isAdmin);

    res.status(200).json({
      success: true,
      message: 'Login successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin || false
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



// Get user profile
export const userProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        username: user.username,
        phone: user.phone,
        email: user.email,
        isAdmin: user.isAdmin,
        accountDetails: user.accountDetails || {
          accountName: null,
          bankName: null,
          accountNumber: null
        }
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { firstName, middleName, lastName, username, phone, email } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Validate email if changed
    if (email && email !== user.email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid email format" 
        });
      }
      
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ 
          success: false,
          error: "Email already in use" 
        });
      }
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (middleName) user.middleName = middleName;
    if (lastName) user.lastName = lastName;
    if (username) user.username = username;
    if (phone) user.phone = phone;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        username: user.username,
        phone: user.phone,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateAccountDetails = async (req, res) => {
  try {
    const { accountName, bankName, accountNumber } = req.body.accountDetails;
    
    // Validate required fields
    if (!accountName || !bankName || !accountNumber) {
      return res.status(400).json({
        success: false,
        error: "All account details fields are required"
      });
    }

    // Validate account number format
    if (!/^[0-9]{10,}$/i.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        error: "Account number must be at least 10 digits"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'accountDetails.accountName': accountName,
          'accountDetails.bankName': bankName,
          'accountDetails.accountNumber': accountNumber
        }
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Account details updated successfully",
      user: {
        id: user._id,
        accountDetails: user.accountDetails
      }
    });
  } catch (error) {
    console.error("Error updating account details:", error);
    res.status(500).json({
      success: false,
      error: "Error updating account details"
    });
  }
};


export const getOrganizersStats = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const organizersData = await User.aggregate([
            {
                // Exclude the current admin user from the list of organizers
                $match: {
                    _id: { $ne: new mongoose.Types.ObjectId(req.user.id) }
                }
            },
            {
                $lookup: {
                    from: 'events',
                    localField: '_id',
                    foreignField: 'organizer',
                    as: 'organizedEvents'
                }
            },
            {
                // Only include users who have actually organized events
                $match: {
                    'organizedEvents.0': { $exists: true }
                }
            },
            {
                $unwind: '$organizedEvents'
            },
            {
                $lookup: {
                    from: 'ticketsales',
                    localField: 'organizedEvents._id',
                    foreignField: 'event',
                    as: 'eventTicketSales'
                }
            },
            {
                $unwind: {
                    path: '$eventTicketSales',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    $or: [
                        { 'eventTicketSales.paymentStatus': 'Successful' },
                        { 'eventTicketSales': { $eq: null } }
                    ]
                }
            },
            {
                $group: {
                    _id: '$_id',
                    username: { $first: '$username' },
                    email: { $first: '$email' },
                    isBanned: { $first: '$isBanned' },
                    totalEvents: { $sum: 1 },
                    totalTicketsSold: {
                        $sum: {
                            $cond: {
                                if: { $ne: ['$eventTicketSales.quantity', null] },
                                then: '$eventTicketSales.quantity',
                                else: 0
                            }
                        }
                    },
                    totalSales: {
                        $sum: {
                            $cond: {
                                if: { $ne: ['$eventTicketSales.totalAmount', null] },
                                then: '$eventTicketSales.totalAmount',
                                else: 0
                            }
                        }
                    },
                    totalRevenue: {
                        $sum: {
                            $cond: {
                                if: { $ne: ['$eventTicketSales.totalAmount', null] },
                                then: { $multiply: ['$eventTicketSales.totalAmount', 0.1] },
                                else: 0
                            }
                        }
                    }
                }
            },
            {
                $sort: { totalSales: -1 }
            },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1, // Ensure the full _id is returned
                    username: 1,
                    email: 1,
                    isBanned: 1,
                    totalEvents: 1,
                    totalTicketsSold: 1,
                    totalSales: 1,
                    totalRevenue: 1
                }
            }
        ]);

        const totalOrganizers = await Event.aggregate([
            { $group: { _id: '$organizer' } },
            { $count: 'organizerCount' }
        ]);

        const totalCount = totalOrganizers.length > 0 ? totalOrganizers[0].organizerCount : 0;

        res.status(200).json({
            success: true,
            data: organizersData,
            pagination: {
                total: totalCount,
                page,
                pages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('Admin getOrganizersStats error:', error);
        res.status(500).json({
            success: false,
            error: "Error fetching organizer stats",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Add validation for the ID
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate the ID format first. This is a crucial security and data integrity check.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Find the user by ID and exclude the password field for security.
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized to view this user's data" });
    }

    // If authorization passes, send the user data.
    // The response will now contain all fields from your schema except the password.
    res.status(200).json(user);

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const toggleUserBanStatus = async (req, res) => {
  try {
    // Extract the user ID from the request parameters
    const { id } = req.params;

    // Validate the user ID before proceeding
    if (!mongoose.isValidObjectId(id)) {
      res.status(400);
      throw new Error('Invalid User ID.');
    }

    // Find the user by ID
    const user = await User.findById(id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Toggle the isBanned status
    user.isBanned = !user.isBanned;
    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: `User ${updatedUser.username} has been ${updatedUser.isBanned ? 'banned' : 'unbanned'}.`,
      data: {
        isBanned: updatedUser.isBanned,
      },
    });
  } catch (error) {
    // Log the error for debugging purposes
    console.error(`Error in toggleUserBanStatus: ${error.message}`);
    
    // Re-throw the error so express-async-handler can catch it and send a response
    throw error;
  }
};

export const getTotalUsers = async (req, res) => {
  try {
    // Count all documents in the User collection where the 'isAdmin' field is false.
    const totalOrganizers = await User.countDocuments({
      isAdmin: false
    });

    // Send a successful response with the count.
    res.status(200).json({
      success: true,
      totalOrganizers,
      message: `Successfully retrieved the total count of organizers (non-admins).`
    });
  } catch (error) {
    // Handle any server-side errors.
    console.error("Error fetching total organizers:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
      error: error.message
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
      res.clearCookie("token"); 
      res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
      res.status(500).json({ success: false, message: "Error logging out" });
  }
};


// // Delete User Account
// export const deleteUserAccount = async (req, res) => {
//   try {
//       await User.findByIdAndDelete(req.user.id);
//       res.status(200).json({ message: "Account deleted successfully" });
//   } catch (error) {
//       res.status(500).json({ error: "Error deleting account: " + error.message });
//   }
// };

// // Change Password
// export const changePassword = async (req, res) => {
//   try {
//       const { currentPassword, newPassword } = req.body;
//       const user = await User.findById(req.user.id);

//       const isMatch = await bcrypt.compare(currentPassword, user.password);
//       if (!isMatch) {
//           return res.status(400).json({ error: "Current password is incorrect" });
//       }

//       if (newPassword.length < 8) {
//           return res.status(400).json({ error: "Password must be at least 8 characters long" });
//       }

//       user.password = await bcrypt.hash(newPassword, 10);
//       await user.save();

//       res.status(200).json({ message: "Password updated successfully" });
//   } catch (error) {
//       res.status(500).json({ error: "Error changing password: " + error.message });
//   }
// };

// // Send Email Notifications
// export const sendEventNotifications = async (req, res) => {
//   try {
//       const { eventId, message } = req.body;
//       const tickets = await Ticket.find({ event: eventId }).populate('user', 'email');

//       const emails = tickets.map(ticket => ticket.user.email);
//       await sendEmail(emails, "Event Notification", message);

//       res.status(200).json({ message: "Notifications sent successfully" });
//   } catch (error) {
//       res.status(500).json({ error: "Error sending notifications: " + error.message });
//   }
// };



