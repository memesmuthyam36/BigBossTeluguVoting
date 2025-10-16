const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  contestantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contestant",
    required: true,
  },
  voterIp: {
    type: String,
    required: true,
  },
  voterId: {
    type: String,
    // For future user authentication system
    default: null,
  },
  voteDate: {
    type: Date,
    default: Date.now,
  },
  // Track daily votes - we can use this to prevent multiple votes per day
  dayKey: {
    type: String,
    required: true,
    // Format: YYYY-MM-DD-IP for daily vote tracking
  },
  userAgent: {
    type: String,
    default: "",
  },
  // Additional metadata
  isValid: {
    type: Boolean,
    default: true,
  },
  source: {
    type: String,
    enum: ["website", "mobile", "api"],
    default: "website",
  },
});

// Compound index to prevent duplicate votes per day per IP
voteSchema.index({ dayKey: 1, contestantId: 1 }, { unique: true });

// Index for querying votes by contestant
voteSchema.index({ contestantId: 1, voteDate: -1 });

// Index for daily vote tracking
voteSchema.index({ dayKey: 1 });

// Static method to create day key for vote tracking
voteSchema.statics.createDayKey = function (ip, date = new Date()) {
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format
  return `${dateStr}-${ip}`;
};

// Static method to check if IP has voted today for a specific contestant
voteSchema.statics.hasVotedToday = async function (ip, contestantId) {
  const dayKey = this.createDayKey(ip);
  const existingVote = await this.findOne({ dayKey, contestantId });
  return !!existingVote;
};

// Static method to get daily vote count for an IP
voteSchema.statics.getDailyVoteCount = async function (ip, date = new Date()) {
  const dayKey = this.createDayKey(ip, date);
  return await this.countDocuments({ dayKey });
};

module.exports = mongoose.model("Vote", voteSchema);
