const cors = require("cors");

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from frontend URLs
    const allowedOrigins = [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "file://", // Allow file:// protocol for local development
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps, curl requests, or file:// protocol)
    if (!origin || origin.startsWith("file://")) return callback(null, true);

    // Allow any localhost origin in development
    if (
      process.env.NODE_ENV === "development" &&
      origin &&
      (origin.includes("localhost") || origin.includes("127.0.0.1"))
    ) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS rejected origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Total-Count"],
};

module.exports = corsOptions;
