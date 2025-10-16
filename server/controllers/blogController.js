const BlogPost = require("../models/BlogPost");
const Comment = require("../models/Comment");

// Get all published blog posts with pagination
const getBlogPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const skip = (page - 1) * limit;

    // Build query
    const query = { isPublished: true };
    if (category && category !== "all") {
      query.category = category;
    }

    const posts = await BlogPost.find(query)
      .select(
        "title slug excerpt featuredImage category viewCount shareCount publishedAt"
      )
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await BlogPost.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog posts",
      error: error.message,
    });
  }
};

// Get a single blog post by slug
const getBlogPost = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await BlogPost.findOne({ slug, isPublished: true }).lean();
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Increment view count (async, don't wait for it)
    BlogPost.findByIdAndUpdate(post._id, { $inc: { viewCount: 1 } }).exec();

    // Get comments for this post
    const comments = await Comment.getCommentsForPost(post._id, true);

    res.json({
      success: true,
      data: {
        post,
        comments,
      },
    });

    // Emit real-time update for view count
    req.app.get("io").emit("postView", {
      postId: post._id,
      newViewCount: post.viewCount + 1,
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog post",
      error: error.message,
    });
  }
};

// Get featured blog posts
const getFeaturedPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const posts = await BlogPost.getFeaturedPosts(limit);
    const recentPosts = await BlogPost.getRecentPosts(3);

    res.json({
      success: true,
      data: {
        featured: posts,
        recent: recentPosts,
      },
    });
  } catch (error) {
    console.error("Error fetching featured posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured posts",
      error: error.message,
    });
  }
};

// Increment share count for a blog post
const sharePost = async (req, res) => {
  try {
    const { slug } = req.params;
    const { platform } = req.body;

    const post = await BlogPost.findOne({ slug, isPublished: true });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    await post.incrementShareCount();

    res.json({
      success: true,
      message: "Share recorded successfully",
      data: {
        shareCount: post.shareCount,
      },
    });

    // Emit real-time update
    req.app.get("io").emit("postShare", {
      postId: post._id,
      platform,
      newShareCount: post.shareCount,
    });
  } catch (error) {
    console.error("Error recording share:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record share",
      error: error.message,
    });
  }
};

// Submit a comment
const submitComment = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, email, content, parentCommentId } = req.body;

    // Find the blog post
    const post = await BlogPost.findOne({ slug, isPublished: true });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Basic validation
    if (!name || !email || !content) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and content are required",
      });
    }

    // Create comment
    const comment = new Comment({
      blogPostId: post._id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      content: content.trim(),
      parentCommentId: parentCommentId || null,
      ipAddress:
        req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
      userAgent: req.get("User-Agent") || "",
    });

    await comment.save();

    // Populate the comment data for response
    const populatedComment = await Comment.findById(comment._id)
      .populate("parentCommentId", "name content")
      .lean();

    res.json({
      success: true,
      message:
        "Comment submitted successfully. It will be reviewed before publishing.",
      data: populatedComment,
    });

    // Note: In a real application, you might want to emit this only to admins
    req.app.get("io").emit("newComment", {
      postId: post._id,
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Error submitting comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit comment",
      error: error.message,
    });
  }
};

module.exports = {
  getBlogPosts,
  getBlogPost,
  getFeaturedPosts,
  sharePost,
  submitComment,
};
