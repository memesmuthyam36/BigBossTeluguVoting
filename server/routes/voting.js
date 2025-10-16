const express = require("express");
const router = express.Router();
const votingController = require("../controllers/votingController");
const rateLimit = require("express-rate-limit");

// Rate limiting for voting endpoints
const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute per IP
  message: {
    success: false,
    message: "Too many voting requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to sensitive endpoints
router.use("/submit", voteLimiter);

// Routes
router.get("/contestants", votingController.getContestants);
router.post("/submit", votingController.submitVote);
router.get("/status", votingController.checkVotingStatus);
router.get("/stats", votingController.getVotingStats);

module.exports = router;
