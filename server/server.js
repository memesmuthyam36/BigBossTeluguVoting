require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const helmet = require("helmet");
const path = require("path");
const mongoose = require("mongoose");

// Import database connection
const connectDB = require("./config/database");

// Import middleware
const corsOptions = require("./middleware/cors");
const { generalLimiter } = require("./middleware/rateLimiter");

// Import routes
const votingRoutes = require("./routes/voting");
const blogRoutes = require("./routes/blog");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(require("cors")(corsOptions));

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set("trust proxy", 1);

// Apply general rate limiting to all routes
app.use("/api/", generalLimiter);

// API Routes
app.use("/api/voting", votingRoutes);
app.use("/api/blog", blogRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Memes Muthyam API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Serve static files from the frontend (if needed)
app.use(express.static(path.join(__dirname, "../")));

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join user to specific rooms if needed
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`🏠 User ${socket.id} joined room: ${room}`);
  });

  // Handle voting updates subscription
  socket.on("subscribe-voting", () => {
    socket.join("voting-updates");
    console.log(`🗳️ User ${socket.id} subscribed to voting updates`);
  });

  // Handle blog updates subscription
  socket.on("subscribe-blog", () => {
    socket.join("blog-updates");
    console.log(`📝 User ${socket.id} subscribed to blog updates`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Make io accessible to controllers
app.set("io", io);

// Database connection check middleware
const checkDatabaseConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database temporarily unavailable",
      error: "Database connection not established",
    });
  }
  next();
};

// Apply database check to all API routes (optional - can be applied selectively)
// app.use('/api', checkDatabaseConnection);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = { message, statusCode: 400 };
  }

  // MongoDB connection errors
  if (
    err.name === "MongooseServerSelectionError" ||
    err.name === "MongoNetworkError"
  ) {
    const message = "Database connection error";
    error = { message, statusCode: 503 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("\n🚀 Memes Muthyam Server Started!");
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log("🔗 API Endpoints:");
  console.log(`   - Voting: http://localhost:${PORT}/api/voting`);
  console.log(`   - Blog: http://localhost:${PORT}/api/blog`);
  console.log("📡 WebSocket enabled for real-time updates\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
    process.exit(0);
  });
});

module.exports = app;
