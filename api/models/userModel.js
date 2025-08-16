import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
{
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple nulls
      trim: true,
      default: function() {
        return `user${Date.now()}`;
      }
    },
    middleName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isBanned: { 
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    termsAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
      required: false, 
    },
    accountDetails: {
      accountName: {
        type: String,
        required: false,
        trim: true,
      },
      accountNumber: {
        type: String,
        required: false, 
        trim: true,
        validate: {
          validator: function (v) {
            return /^[0-9]{10,}$/i.test(v); 
          },
          message: "Invalid account number format.",
        },
      },
      bankName: {
        type: String,
        required: false,
        trim: true,
      },
    },
}, {
    timestamps: true, 
}
);

const User = mongoose.model("User", UserSchema);

export default User;
