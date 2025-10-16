const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  excerpt: {
    type: String,
    maxlength: 500,
  },
  featuredImage: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["memes", "analysis", "behind-scenes", "updates", "news"],
    default: "memes",
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  author: {
    type: String,
    required: true,
    default: "Admin",
  },
  // SEO fields
  metaDescription: {
    type: String,
    maxlength: 160,
  },
  metaKeywords: [
    {
      type: String,
      trim: true,
    },
  ],
  // Engagement metrics
  viewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  shareCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Status fields
  isPublished: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  // Dates
  publishedAt: {
    type: Date,
    default: null,
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

// Indexes for better query performance
blogPostSchema.index({ isPublished: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, isPublished: 1, publishedAt: -1 });
blogPostSchema.index({ isFeatured: 1, isPublished: 1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ slug: 1 });

// Update the updatedAt field before saving
blogPostSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Auto-generate slug from title if not provided
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }

  // Set publishedAt when isPublished becomes true
  if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// Auto-generate excerpt from content if not provided
blogPostSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.excerpt) {
    this.excerpt =
      this.content
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .substring(0, 300)
        .trim() + "...";
  }
  next();
});

// Method to increment view count
blogPostSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  this.updatedAt = new Date();
  return this.save();
};

// Method to increment share count
blogPostSchema.methods.incrementShareCount = function () {
  this.shareCount += 1;
  this.updatedAt = new Date();
  return this.save();
};

// Static method to get recent posts
blogPostSchema.statics.getRecentPosts = function (limit = 10) {
  return this.find({ isPublished: true })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select("title slug excerpt featuredImage category viewCount publishedAt");
};

// Static method to get featured posts
blogPostSchema.statics.getFeaturedPosts = function (limit = 5) {
  return this.find({ isPublished: true, isFeatured: true })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model("BlogPost", blogPostSchema);
