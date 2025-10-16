const mongoose = require("mongoose");

const contestantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  image: {
    type: String,
    required: true,
  },
  votes: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  season: {
    type: String,
    default: "current",
  },
  // Additional fields for contestant management
  eliminationDate: {
    type: Date,
    default: null,
  },
  entryDate: {
    type: Date,
    default: Date.now,
  },
  socialLinks: {
    instagram: String,
    twitter: String,
    facebook: String,
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for better query performance
contestantSchema.index({ isActive: 1, votes: -1 });
contestantSchema.index({ season: 1, votes: -1 });

// Update the updatedAt field before saving
contestantSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for vote percentage (calculated based on total votes of all active contestants)
contestantSchema.virtual("votePercentage").get(function () {
  // This will be calculated dynamically in the controller
  return 0;
});

// Method to increment votes
contestantSchema.methods.incrementVotes = function () {
  this.votes += 1;
  this.updatedAt = new Date();
  return this.save();
};

// Method to decrement votes (if needed for admin actions)
contestantSchema.methods.decrementVotes = function () {
  if (this.votes > 0) {
    this.votes -= 1;
    this.updatedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model("Contestant", contestantSchema);
