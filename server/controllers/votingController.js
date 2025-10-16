const Contestant = require("../models/Contestant");
const Vote = require("../models/Vote");

// Get all active contestants with vote data
const getContestants = async (req, res) => {
  try {
    const contestants = await Contestant.find({ isActive: true })
      .sort({ votes: -1 })
      .lean();

    // Calculate total votes for percentage calculation
    const totalVotes = contestants.reduce(
      (sum, contestant) => sum + contestant.votes,
      0
    );

    // Add vote percentage to each contestant
    const contestantsWithPercentage = contestants.map((contestant) => ({
      ...contestant,
      votePercentage:
        totalVotes > 0 ? Math.round((contestant.votes / totalVotes) * 100) : 0,
    }));

    res.json({
      success: true,
      data: contestantsWithPercentage,
      totalVotes,
      totalContestants: contestants.length,
    });
  } catch (error) {
    console.error("Error fetching contestants:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contestants",
      error: error.message,
    });
  }
};

// Submit a vote
const submitVote = async (req, res) => {
  try {
    const { contestantId } = req.body;
    const voterIp =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    if (!contestantId) {
      return res.status(400).json({
        success: false,
        message: "Contestant ID is required",
      });
    }

    // Check if contestant exists and is active
    const contestant = await Contestant.findById(contestantId);
    if (!contestant || !contestant.isActive) {
      return res.status(404).json({
        success: false,
        message: "Contestant not found or inactive",
      });
    }

    // Check if IP has already voted today for this contestant
    const hasVotedToday = await Vote.hasVotedToday(voterIp, contestantId);
    if (hasVotedToday) {
      return res.status(400).json({
        success: false,
        message: "You have already voted for this contestant today",
      });
    }

    // Check daily vote limit (prevent spam voting for multiple contestants)
    const dailyVoteCount = await Vote.getDailyVoteCount(voterIp);
    if (dailyVoteCount >= 3) {
      // Limit to 3 votes per day per IP
      return res.status(400).json({
        success: false,
        message: "Daily vote limit reached (3 votes per day)",
      });
    }

    // Create vote record
    const dayKey = Vote.createDayKey(voterIp);
    const vote = new Vote({
      contestantId,
      voterIp,
      dayKey,
      userAgent: req.get("User-Agent") || "",
      source: "website",
    });

    await vote.save();

    // Increment contestant's vote count
    await contestant.incrementVotes();

    // Get updated contestant data
    const updatedContestant = await Contestant.findById(contestantId).lean();

    // Calculate new percentage with all contestants
    const allContestants = await Contestant.find({ isActive: true }).lean();
    const totalVotes = allContestants.reduce((sum, c) => sum + c.votes, 0);
    const votePercentage =
      totalVotes > 0
        ? Math.round((updatedContestant.votes / totalVotes) * 100)
        : 0;

    res.json({
      success: true,
      message: "Vote submitted successfully",
      data: {
        contestant: {
          ...updatedContestant,
          votePercentage,
        },
        remainingVotes: 3 - (dailyVoteCount + 1),
      },
    });

    // Emit real-time update to all connected clients
    req.app.get("io").emit("voteUpdate", {
      contestantId,
      newVoteCount: updatedContestant.votes,
      votePercentage,
      totalVotes,
    });
  } catch (error) {
    console.error("Error submitting vote:", error);

    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already voted for this contestant today",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to submit vote",
      error: error.message,
    });
  }
};

// Check if IP has voted today
const checkVotingStatus = async (req, res) => {
  try {
    const voterIp =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    // Get today's votes for this IP
    const dailyVoteCount = await Vote.getDailyVoteCount(voterIp);

    // Get which contestants this IP has voted for today
    const dayKey = Vote.createDayKey(voterIp);
    const votedToday = await Vote.find({ dayKey })
      .populate("contestantId", "name _id")
      .lean();

    res.json({
      success: true,
      data: {
        dailyVoteCount,
        remainingVotes: Math.max(0, 3 - dailyVoteCount),
        votedContestants: votedToday.map((vote) => ({
          contestantId: vote.contestantId._id,
          contestantName: vote.contestantId.name,
          voteTime: vote.voteDate,
        })),
      },
    });
  } catch (error) {
    console.error("Error checking voting status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check voting status",
      error: error.message,
    });
  }
};

// Get voting statistics
const getVotingStats = async (req, res) => {
  try {
    const totalVotes = await Vote.countDocuments({ isValid: true });
    const activeContestants = await Contestant.countDocuments({
      isActive: true,
    });

    // Get votes from last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentVotes = await Vote.countDocuments({
      voteDate: { $gte: last24Hours },
      isValid: true,
    });

    // Get top 3 contestants
    const topContestants = await Contestant.find({ isActive: true })
      .sort({ votes: -1 })
      .limit(3)
      .select("name votes _id")
      .lean();

    res.json({
      success: true,
      data: {
        totalVotes,
        activeContestants,
        recentVotes,
        topContestants,
      },
    });
  } catch (error) {
    console.error("Error fetching voting stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch voting statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getContestants,
  submitVote,
  checkVotingStatus,
  getVotingStats,
};
