const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  blogPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BlogPost",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  // Status fields
  isApproved: {
    type: Boolean,
    default: false,
  },
  isSpam: {
    type: Boolean,
    default: false,
  },
  // Engagement
  likes: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Reply system
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  isReply: {
    type: Boolean,
    default: false,
  },
  // Metadata
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
commentSchema.index({ blogPostId: 1, isApproved: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1 });
commentSchema.index({ email: 1, createdAt: -1 });

// Update the updatedAt field before saving
commentSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Mark as reply if parentCommentId is set
  if (this.parentCommentId && !this.isReply) {
    this.isReply = true;
  }

  next();
});

// Method to increment likes
commentSchema.methods.incrementLikes = function () {
  this.likes += 1;
  this.updatedAt = new Date();
  return this.save();
};

// Static method to get comments for a blog post
commentSchema.statics.getCommentsForPost = function (
  blogPostId,
  includeReplies = true
) {
  const query = {
    blogPostId,
    isApproved: true,
    isSpam: false,
  };

  if (!includeReplies) {
    query.isReply = false;
  }

  return this.find(query).populate("parentCommentId").sort({ createdAt: -1 });
};

module.exports = mongoose.model("Comment", commentSchema);
