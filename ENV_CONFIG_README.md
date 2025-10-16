# Frontend Environment Configuration Guide

## Overview

This frontend application connects to a backend API. You need to configure the backend URL before deployment.

## Setup for Development

### Option 1: Using config.js (Recommended for static hosting)

1. Open `js/config.js`
2. Update the API URLs:

```javascript
const CONFIG = {
  API_URL: "http://localhost:3000", // Your backend base URL
  API_BASE_URL: "http://localhost:3000/api", // Your backend API endpoint
  ENV: "development",
};
```

### Option 2: Using .env file (for build systems)

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Update the values in `.env.local`:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

Note: This requires a build system like Vite or Webpack.

## Setup for Production

### 1. Update config.js

Open `js/config.js` and change:

```javascript
const CONFIG = {
  API_URL: "https://your-backend-domain.com",
  API_BASE_URL: "https://your-backend-domain.com/api",
  ENV: "production",
};
```

### 2. Include config.js in HTML

Make sure `config.js` is loaded **before** other scripts in your HTML files:

```html
<!-- Load config first -->
<script src="js/config.js"></script>

<!-- Then load other scripts -->
<script src="js/voting.js"></script>
```

## Configuration Options

### Available Settings

| Setting                   | Description                       | Default                     |
| ------------------------- | --------------------------------- | --------------------------- |
| `API_URL`                 | Backend server base URL           | `http://localhost:3000`     |
| `API_BASE_URL`            | Backend API endpoint              | `http://localhost:3000/api` |
| `ENV`                     | Environment mode                  | `development`               |
| `ENABLE_SOCKET`           | Enable WebSocket connections      | `true`                      |
| `ENABLE_POLLING_FALLBACK` | Enable polling if WebSocket fails | `true`                      |
| `API_TIMEOUT`             | API request timeout (ms)          | `10000`                     |
| `POLLING_INTERVAL`        | Polling interval (ms)             | `30000`                     |

### Helper Methods

The config object provides helper methods:

```javascript
// Get full API endpoint URL
CONFIG.getApiUrl("/voting/contestants");
// Returns: "http://localhost:3000/api/voting/contestants"

// Get socket URL
CONFIG.getSocketUrl();
// Returns: "http://localhost:3000"

// Check if in production
CONFIG.isProduction();
// Returns: true or false
```

## Usage in JavaScript Files

Access the configuration in your JavaScript:

```javascript
// Access the global config
const apiUrl = window.APP_CONFIG.API_BASE_URL;

// Use helper methods
const endpoint = window.APP_CONFIG.getApiUrl("/voting/contestants");

// Make API calls
fetch(endpoint)
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## Files Modified

The following files have been updated to use the configuration:

- ✅ `js/config.js` - Configuration file (NEW)
- ✅ `js/voting.js` - Updated to use config
- ⚠️ `voting.html` - Needs to include config.js
- ⚠️ `index.html` - Needs to include config.js (if using voting features)

## Deployment Checklist

Before deploying to production:

- [ ] Update `API_URL` in `config.js` to production backend URL
- [ ] Update `API_BASE_URL` in `config.js` to production API endpoint
- [ ] Set `ENV` to `'production'` in `config.js`
- [ ] Test all API connections
- [ ] Verify WebSocket connections work
- [ ] Check CORS settings on backend
- [ ] Ensure HTTPS is used for production URLs

## CORS Configuration

Make sure your backend allows requests from your frontend domain. In your backend `.env`:

```env
FRONTEND_URL=https://your-frontend-domain.com
```

And in your backend CORS configuration:

```javascript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

## Troubleshooting

### Problem: Cannot connect to API

**Solution:**

1. Check if `config.js` is loaded before other scripts
2. Verify the API URL in browser console: `console.log(window.APP_CONFIG)`
3. Check browser network tab for failed requests
4. Verify backend CORS settings

### Problem: WebSocket connection fails

**Solution:**

1. Check if Socket.IO is loaded correctly
2. Verify the socket URL: `console.log(window.APP_CONFIG.getSocketUrl())`
3. Check backend WebSocket configuration
4. Enable polling fallback in config

### Problem: Config not found error

**Solution:**
Add this fallback in your JavaScript:

```javascript
const config = window.APP_CONFIG || {
  API_BASE_URL: "http://localhost:3000/api",
  API_URL: "http://localhost:3000",
};
```

## Security Notes

- ⚠️ Never commit `.env` or `.env.local` files to git
- ✅ Use `.env.example` as a template only
- ✅ Use environment-specific configurations
- ✅ Ensure backend has proper CORS and authentication
- ✅ Use HTTPS in production

## Support

For issues or questions:

- Check backend server is running
- Verify network connectivity
- Review browser console for errors
- Check backend logs for connection issues
