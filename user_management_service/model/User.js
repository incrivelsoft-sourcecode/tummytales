const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    user_name: {
      type: String,
      required: true,
      unique: true, // ✅ Unique constraint automatically creates an index
    },
    email: {
      type: String,
      required: true,
      unique: true, // ✅ Unique constraint automatically creates an index
    },
    password: {
      type: String,
      required: false, // ✅ Make optional, validation handled separately
    },
    googleId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["supporter", "mom"],
      default: "mom",
    },
    mom_referals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserDetails",
      },
    ],
    referals: [
      {
        first_name: { type: String, required: false },
        last_name: { type: String, required: false },
        referal_email: { type: String, required: true },
        permissions: { type: [String], required: true },
        role: { type: String, enum: ["supporter"], default: "supporter" },
        relation: { type: String, default: "" },
        status: {
          type: String,
          enum: ["pending", "accepted", "expired"],
          default: "pending",
        },
        referal_code: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "UserDetails",
          default: null,
        },
        sentAt: { type: Date, default: Date.now },
        resentCount: { type: Number, default: 0 },
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
    permissions: {
      type: [String],
      default: [],
    },
    // ✅ New fields for OTP verification
    status: {
      type: String,
      enum: ["unverified", "verified"],
      default: "unverified",
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ REMOVED duplicate index definitions (they are already created by `unique: true`)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next(); // ✅ Skip hashing if no password is set
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const UserDetails = mongoose.model("UserDetails", userSchema);

module.exports = UserDetails;









/*const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  user_name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId; // Require password only for non-Google users
    },
  },
  googleId: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["supporter", "mom"],
    default: "mom",
  },
  mom_referals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserDetails",
  }],
  referal_code: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserDetails",
    default: null,
  },
  permissions: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

// Indexing for faster queries
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ user_name: 1 }, { unique: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};


const UserDetails = mongoose.model("UserDetails", userSchema);

module.exports = UserDetails;
*/