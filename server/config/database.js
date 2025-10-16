const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI ||
      "mongodb+srv://memesmuthyam36:memesmuthyam36@memes-muthyam.u9tgpbt.mongodb.net/memes-muthyam";

    console.log("🔗 Attempting to connect to MongoDB Atlas...");
    console.log(
      "📍 Connection string:",
      mongoURI.replace(/\/\/.*@/, "//****:****@")
    ); // Hide credentials in log

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased timeout for Atlas
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true,
      w: "majority",
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("connected", () => {
      console.log("📡 Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("🔌 Mongoose disconnected from MongoDB");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("🔒 MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("🔍 Error details:", {
      name: error.name,
      code: error.code,
      reason: error.reason?.topologyVersion,
    });

    // In development, continue without database
    if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
      console.log(
        "⚠️  Continuing in development mode without database connection"
      );
      console.log("💡 MongoDB Atlas connection troubleshooting:");
      console.log("   - Check if your IP is whitelisted in Atlas");
      console.log("   - Verify username/password are correct");
      console.log("   - Ensure the cluster is running");
      console.log("   - Check network connectivity");
      return;
    }

    // In production, exit the process
    console.error("🛑 Critical: Database connection required in production");
    process.exit(1);
  }
};

module.exports = connectDB;
