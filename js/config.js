/**
 * Frontend Configuration
 * This file contains all environment-specific configuration for the frontend
 */

const CONFIG = {
  // API Configuration
  API_URL: "https://big-boss-telugu-voting-server.vercel.app",
  API_BASE_URL: "https://big-boss-telugu-voting-server.vercel.app/api",

  // For production, update these values:
  // API_URL: 'https://your-backend-domain.com',
  // API_BASE_URL: 'https://your-backend-domain.com/api',

  // Environment
  ENV: "development", // 'development' or 'production'

  // Feature flags
  ENABLE_SOCKET: true,
  ENABLE_POLLING_FALLBACK: true,

  // Timeouts and intervals (in milliseconds)
  API_TIMEOUT: 10000,
  POLLING_INTERVAL: 30000,

  // Get the full API endpoint URL
  getApiUrl: function (endpoint = "") {
    return `${this.API_BASE_URL}${endpoint}`;
  },

  // Get the socket URL
  getSocketUrl: function () {
    return this.API_URL;
  },

  // Check if in production mode
  isProduction: function () {
    return this.ENV === "production";
  },
};

// Make config available globally
if (typeof window !== "undefined") {
  window.APP_CONFIG = CONFIG;
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}
