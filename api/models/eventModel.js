import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, "Event name is required"],
      // ,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          return new Date(value) > new Date(); // Future date check
        },
        message: 'Start date must be in the future'
      }
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          // Get the current start date - either from this document or the update
          const start = this.startDate || (this._update && this._update.$set && this._update.$set.startDate);
          return new Date(value) > new Date(start);
        },
        message: 'End date must be after start date'
      }
    },

    location: {
      type: String,
      required: [true, "Location is required"],
      // ,
    },
    eventCategory: {
      type: String,
      required: [true, "Event category is required"],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    customTicketUrl: {
      type: String,
      required: true,
    },

   isPublished: {
      type: Boolean,
      default: true, // Events are published by default
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'ended', 'draft'],
      default: 'active'
    },
    adminUnpublished: { // NEW FIELD
      type: Boolean,
      default: false, // False by default, set to true only when admin unpublishes
    }, 
    eventImage: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /\.(jpeg|jpg|png)$/i.test(v),
        message: "Event image must be a valid JPEG or PNG file.",
      },
    },

    tickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket"
      }
    ],
    socialMediaLinks: {
      facebook: { type: String, required: false },
      twitter: { type: String, required: false },
      instagram: { type: String, required: false },
      linkedin: { type: String, required: false }
    }
  },
  {
    timestamps: true,
  }
);

eventSchema.index(
  { customTicketUrl: 1, status: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { status: 'active' }
  }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;