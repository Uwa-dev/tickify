import Event from "../models/eventModel.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import Ticket from "../models/ticketModel.js";
import mongoose from 'mongoose';


export const createEvent = async (req, res) => {
  const {
    eventName,
    description,
    eventStartDate,
    eventStartTime,
    eventEndDate,
    eventEndTime,
    eventCategory,
    location,
    customURL,
    facebook,
    twitter,
    instagram,
    linkedin
  } = req.body;

  try {
    // 1. Check if the authenticated user is banned
    // The correct object to access is req.user
    if (!req.user || req.user.isBanned) {
        return res.status(403).json({
            success: false,
            message: "You are currently banned and cannot create events. Please contact support if you believe this is an error."
        });
    }

    // 2. Validate custom URL and check for active events with same URL
    if (!customURL || typeof customURL !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: 'Valid custom URL is required' 
      });
    }

    const activeEventWithSameURL = await Event.findOne({ 
      customTicketUrl: customURL,
      status: 'active' // Only check active events
    });
    
    if (activeEventWithSameURL) {
      return res.status(400).json({
        success: false,
        message: 'This URL is currently in use by an active event'
      });
    }

    // 3. Process dates
    const startDate = new Date(`${eventStartDate}T${eventStartTime}`);
    const endDate = new Date(`${eventEndDate}T${eventEndTime}`);
    
    // 4. Get organizer from authenticated user
    const organizer = req.user.id;

    // 5. Upload image (required)
    let uploadedImage = null;
    if (req.file) {
      uploadedImage = await uploadToCloudinary(req.file, "events");
    }

    if (!uploadedImage) {
      return res.status(400).json({ error: "Image is required" });
    }

    // 6. Prepare social media links
    const socialMediaLinks = {};
    if (facebook) socialMediaLinks.facebook = facebook;
    if (twitter) socialMediaLinks.twitter = twitter;
    if (instagram) socialMediaLinks.instagram = instagram;
    if (linkedin) socialMediaLinks.linkedin = linkedin;

    // 7. Create event
    const newEvent = new Event({
      eventName,
      description,
      startDate,
      endDate,
      eventCategory,
      location,
      eventImage: uploadedImage,
      customTicketUrl: customURL,
      organizer,
      status: 'active',
      socialMediaLinks: Object.keys(socialMediaLinks).length > 0 ? socialMediaLinks : undefined
    });

    await newEvent.save();
    
    res.status(201).json({ 
      success: true,
      eventId: newEvent.id,
      message: "Event created successfully", 
      event: newEvent 
    });

  } catch (error) {
    console.error('Error creating event:', error);
    
    // Handle duplicate key error for active events
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This URL is already in use by an active event'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: "Error creating event: " + error.message 
    });
  }
};

// View all events by a user/organizer
export const getEventsByOrganizer = async (req, res) => {
  try {
    const organizer = req.user.id; // Assuming `req.user.id` contains the authenticated user's ID
    const events = await Event.find({ organizer });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: "Error fetching events: " + error.message });
  }
};

// Get a single event by ID
export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate('organizer');

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if the user is the organizer or an admin
    // const isOrganizer = event.organizer.toString() === req.user.id.toString();
    // const isAdmin = req.user.isAdmin === true;


    // if (!isOrganizer && !isAdmin) {
    //   return res.status(403).json({ 
    //     error: "Not authorized to view this event",
    //     details: {
    //       isOrganizer,
    //       isAdmin,
    //       organizer: event.organizer.toString(),
    //       userId: req.user.id
    //     }
    //   });
    // }

    res.status(200).json(event);

  } catch (error) {
    res.status(500).json({ error: "Error fetching event: " + error.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtering options
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { eventName: { $regex: req.query.search, $options: 'i' } },
        { 'organizer.username': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Sorting options
    const sort = {};
    if (req.query.sortBy && req.query.sortOrder) {
        sort[req.query.sortBy] = req.query.sortOrder === 'asc' ? 1 : -1;
    } else {
        // Default sorting: Upcoming events first, then Past events.
        // Within each group, sort by endDate ascending.
        sort.isPastEvent = 1; // false (upcoming) comes before true (past)
        sort.endDate = 1;     // earliest end date first within each group
    }


    // Get events with organizer details and ticket stats
    const events = await Event.aggregate([
      { $match: filter },
      { $lookup: {
          from: 'users',
          localField: 'organizer',
          foreignField: '_id',
          as: 'organizer'
        }
      },
      { $unwind: '$organizer' },
      { $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'event',
          as: 'tickets'
        }
      },
      {
        // NEW: Add a field to categorize events as past or not
        $addFields: {
          isPastEvent: { $lt: ["$endDate", new Date()] }, // true if endDate is in the past
          ticketsSold: { $size: '$tickets' },
          totalRevenue: {
            $multiply: [
              { $sum: '$tickets.price' },
              0.1 // Assuming 10% platform fee
            ]
          }
        }
      },
      { $project: {
          _id: 1,
          eventName: 1, // Ensure eventName is projected
          status: 1, // This is the original status from the Event model
          startDate: 1,
          endDate: 1, // Include endDate in project for sorting
          createdAt: 1, // Include createdAt for potential secondary sorting
          'organizer.username': 1,
          ticketsSold: 1,
          totalRevenue: 1,
          isPublished: 1,
          isPastEvent: 1 // Include the new field for sorting
        }
      },
      { $sort: sort }, // Apply sorting here
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total count for pagination
    const totalEvents = await Event.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: events.map(event => ({
        eventId: `#${event._id.toString().slice(-4).toUpperCase()}`,
        _id: event._id, // Include actual _id for Link component
        eventName: event.eventName, // FIXED: Include eventName here
        username: event.organizer.username,
        // Frontend derived status:
        status: new Date(event.endDate) < new Date() ? 'Past' : 'In-Progress',
        ticketsSold: event.ticketsSold,
        amount: event.totalRevenue / 0.1, // Original amount (total sales before fee)
        revenue: event.totalRevenue, // Platform fee revenue
        isPublished: event.isPublished
      })),
      pagination: {
        total: totalEvents,
        page,
        pages: Math.ceil(totalEvents / limit)
      }
    });

  } catch (error) {
    console.error('Admin events error:', error);
    res.status(500).json({
      success: false,
      error: "Error fetching events",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// get all events by the custom url
export const getEventByCustomUrl = async (req, res) => {
  try {
    const { slug } = req.params;
    const customUrl = `tickify/events/${slug}`;
    
    // Find any event with this URL (regardless of status)
    const event = await Event.findOne({ 
      $or: [
        { customTicketUrl: req.params.customUrl }, // matches "sekanniii"
        { customTicketUrl: `tickify/events/${req.params.customUrl}` }, // matches full path
        { customTicketUrl: new RegExp(req.params.customUrl + '$') } // matches ending
      ]
    }).populate('tickets');
    
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'No event found with this URL'
      });
    }

    // Check if event has ended
    if (event.status === 'ended' || event.endDate < new Date()) {
      return res.status(410).json({ // 410 Gone is appropriate for ended events
        status: 'fail',
        message: 'This event has ended',
        data: {
          ended: true,
          previousEvent: { // Provide minimal event info
            name: event.eventName,
            endDate: event.endDate
          }
        }
      });
    }

    // Check if event is active
    if (event.status !== 'active') {
      return res.status(403).json({
        status: 'fail',
        message: 'This event is not currently active'
      });
    }

    // Return the active event
    res.status(200).json({
      status: 'success',
      data: { event }
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getAllPublishedEvents = async (req, res) => {
  try {
    const currentDate = new Date();

    // 1. First get events without population
    const events = await Event.find({ 
      status: 'active',
      startDate: { $gte: currentDate } 
    })
    .select('-__v -createdAt -updatedAt -organizer')
    .lean();


    if (events.length === 0) {
      return res.status(200).json({
        status: true,
        data: [],
        count: 0,
        message: "No upcoming events found"
      });
    }

    // 2. Manually populate tickets for better control
    const eventsWithTickets = await Promise.all(
      events.map(async event => {
        const tickets = await Ticket.find({
          _id: { $in: event.tickets },
          quantity: { $gt: 0 }
        })
        .select('ticketType price _id')
        .lean();

        return {
          ...event,
          tickets
        };
      })
    );

    // 3. Filter events with available tickets
    const filteredEvents = eventsWithTickets.filter(event => 
      event.tickets && event.tickets.length > 0
    );

    res.status(200).json({
      status: true,
      data: filteredEvents,
      count: filteredEvents.length
    });

  } catch (error) {
    console.error("Detailed error:", {
      message: error.message,
      stack: error.stack,
      query: error.query
    });
    
    res.status(500).json({ 
      status: false,
      message: "Error fetching events",
      error: error.message 
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id.toString();
    const updateData = req.body;

    // Parse and validate dates first
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    // Manual validation
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
        received: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          differenceMs: endDate - startDate
        }
      });
    }

    // Find the existing event first
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }

    // Verify organizer
    if (event.organizer.toString() !== organizerId) {
      return res.status(403).json({
        success: false,
        message: "Only the event organizer can update this event"
      });
    }

    // Prepare update - use $set operator for proper validation
    const update = { 
      $set: {
        ...updateData,
        startDate: startDate,
        endDate: endDate
      } 
    };

    // Handle image separately if needed
    if (req.file) {
      update.$set.eventImage = req.file.path;
    }

    // Update social media links
    if (updateData.socialMediaLinks) {
      update.$set.socialMediaLinks = {
        ...event.socialMediaLinks,
        ...updateData.socialMediaLinks
      };
    }

    // Perform the update with proper validation
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      update,
      { 
        new: true, 
        runValidators: true,
        context: 'query' // Important for validators to work correctly
      }
    );

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the event",
      error: error.message,
    });
  }
};

export const toggleEventPublishStatus = async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ success: false, message: "Invalid Event ID." });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found." });
        }

        const isAdmin = req.user.isAdmin === true;
        const isOrganizer = event.organizer.toString() === req.user.id.toString();

        // Authorization Check
        if (!isAdmin && !isOrganizer) {
            return res.status(403).json({ success: false, message: "Not authorized to modify this event." });
        }

        // Check if an admin has previously unpublished this event
        if (event.adminUnpublished && !isAdmin) {
            return res.status(403).json({ success: false, message: "This event was unpublished by an admin and can only be republished by an admin." });
        }

        // Toggle isPublished
        event.isPublished = !event.isPublished;

        // Update status based on new isPublished and event date
        const now = new Date();
        const eventHasEnded = new Date(event.endDate) < now;

        if (event.isPublished) {
            // If publishing
            if (!eventHasEnded) {
                event.status = 'active'; // Only activate if event has not ended
            } else {
                event.status = 'ended'; // Event has ended, so status is 'ended' regardless of publish state
            }
            // If an admin is publishing, they are effectively "releasing" the adminUnpublished flag
            if (isAdmin) {
                event.adminUnpublished = false;
            }
        } else {
            // If unpublishing
            event.status = 'inactive';
            // If an admin is unpublishing, set the adminUnpublished flag
            if (isAdmin) {
                event.adminUnpublished = true;
            } else {
                // If an organizer is unpublishing, ensure adminUnpublished remains false
                event.adminUnpublished = false;
            }
        }

        // FIXED: Skip validation for this save operation to bypass startDate validator
        await event.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: `Event '${event.eventName}' publish status toggled to ${event.isPublished ? 'published' : 'unpublished'}. Status set to '${event.status}'.`,
            data: {
                _id: event._id,
                isPublished: event.isPublished,
                status: event.status, // Return the updated status
                adminUnpublished: event.adminUnpublished // Return the updated flag
            }
        });

    } catch (error) {
        console.error("Error toggling event publish status:", error);
        res.status(500).json({
            success: false,
            error: "Failed to toggle publish status",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};






// Delete a finished event
export const deleteFinishedEvent = async (req, res) => {
  try {
    const { id } = req.params; // Event ID from URL parameters
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.date >= new Date()) {
      return res
        .status(400)
        .json({ error: "Cannot delete an ongoing or upcoming event" });
    }

    await event.remove();
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting event: " + error.message });
  }
};

// View all published events by a user/organizer
export const getPublishedEventsByOrganizer = async (req, res) => {
  try {
    const organizer = req.user.id; // Assuming `req.user.id` contains the authenticated user's ID
    const events = await Event.find({ organizer, date: { $gte: new Date() } }); // Future events only
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: "Error fetching events: " + error.message });
  }
};

// Delete a published event that hasn't sold any tickets
export const deleteUnsoldPublishedEvent = async (req, res) => {
  try {
    const { id } = req.params; // Event ID from URL parameters
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if the event is published (future date) and has no tickets sold
    if (event.date < new Date()) {
      return res
        .status(400)
        .json({ error: "Event is not published (already finished)." });
    }

    if (event.soldTickets > 0) {
      return res
        .status(400)
        .json({ error: "Cannot delete an event that has sold tickets." });
    }

    // Delete the event
    await event.remove();
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting event: " + error.message });
  }
};

export const getEventWithOrganizerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the event and populate the organizer's account details
    const event = await Event.findById(id).populate({
      path: "organizer",
      select: "username email accountDetails",
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json({
      message: "Event retrieved successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({ error: "Error retrieving event: " + error.message });
  }
};

// Search Events
export const searchEvents = async (req, res) => {
  try {
    const { keyword, date, location } = req.query;

    const query = {};
    if (keyword) query.eventName = { $regex: keyword, $options: "i" };
    if (date) query.date = new Date(date);
    if (location) query.location = { $regex: location, $options: "i" };

    const events = await Event.find(query);
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: "Error searching events: " + error.message });
  }
};

export const allFutureEvents = async (req, res) => {
  try {
    const currentDate = new Date();

    const events = await Event.find({
      isPublished: true,
      status: 'active',
      adminUnpublished: false, // Ensure it's not manually unpublished by an admin
      startDate: { $gte: currentDate },
    }).sort({ startDate: 1 }); // Sort by start date to show upcoming events first

    // If no events are found, return a 200 OK with an empty array
    if (!events || events.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // If events are found, send a successful response
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching future events:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
      error: error.message,
    });
  }
};



// Get Events by Category
export const getEventsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const events = await Event.find({ eventType: category });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: "Error fetching events: " + error.message });
  }
};

// Stop Events from Selling Tickets
export const stopTicketSales = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    event.isSalesStopped = true;
    await event.save();

    res.status(200).json({ message: "Event sales stopped successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error stopping sales: " + error.message });
  }
};

export const saveEventData = async (req, res) => {
  try {
    const { eventId, ...stepData } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Find and update the event
    const event = await Event.findByIdAndUpdate(
      eventId,
      { $set: stepData },
      { new: true, upsert: false } // Prevent creating new event if not found
    );

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json({ message: "Step data saved successfully", event });
  } catch (error) {
    res.status(500).json({ error: "Failed to save data: " + error.message });
  }
};


