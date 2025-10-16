const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const rateLimit = require("express-rate-limit");

// Rate limiting for comment submission
const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 comments per 15 minutes per IP
  message: {
    success: false,
    message: "Too many comments, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
router.get("/posts", blogController.getBlogPosts);
router.get("/featured", blogController.getFeaturedPosts);
router.get("/post/:slug", blogController.getBlogPost);
router.post("/post/:slug/share", blogController.sharePost);
router.post(
  "/post/:slug/comment",
  commentLimiter,
  blogController.submitComment
);

module.exports = router;
