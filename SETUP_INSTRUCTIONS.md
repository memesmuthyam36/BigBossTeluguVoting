# Frontend Environment Configuration - Setup Instructions

## What Has Been Done

I've set up your frontend to connect to the backend using a configuration system. Here's what was created/modified:

### New Files Created:

1. **`js/config.js`** - Main configuration file
2. **`.env.example`** - Environment variables template
3. **`ENV_CONFIG_README.md`** - Detailed configuration guide
4. **`SETUP_INSTRUCTIONS.md`** - This file

### Files Modified:

1. **`js/voting.js`** - Updated to use configuration from `config.js`
2. **`voting.html`** - Added `config.js` script tag

## Quick Start

### For Development (Local Testing)

1. **No additional setup needed!** The default configuration in `js/config.js` is already set to:

   ```javascript
   API_URL: "http://localhost:3000";
   API_BASE_URL: "http://localhost:3000/api";
   ```

2. **Start your backend server** (make sure it's running on port 3000)

3. **Open your frontend** in a browser and it should connect automatically

### For Production Deployment

1. **Open `js/config.js`**

2. **Update these values**:

   ```javascript
   const CONFIG = {
     API_URL: "https://your-backend-domain.com", // Change this
     API_BASE_URL: "https://your-backend-domain.com/api", // Change this
     ENV: "production", // Change from 'development' to 'production'
   };
   ```

3. **Deploy your frontend** to your hosting provider

4. **Test the connection** to ensure frontend can reach backend

## Configuration File Explained

### `js/config.js`

This is the main configuration file. Here's what each setting means:

```javascript
const CONFIG = {
  // Backend server base URL (no trailing slash)
  API_URL: "http://localhost:3000",

  // Backend API endpoint (includes /api path)
  API_BASE_URL: "http://localhost:3000/api",

  // Environment mode
  ENV: "development", // or 'production'

  // WebSocket configuration
  ENABLE_SOCKET: true,
  ENABLE_POLLING_FALLBACK: true,

  // Timeouts
  API_TIMEOUT: 10000, // 10 seconds
  POLLING_INTERVAL: 30000, // 30 seconds
};
```

## How It Works

### 1. Config Loading

The `config.js` file is loaded before other scripts in `voting.html`:

```html
<script src="js/config.js"></script>
<!-- Loaded first -->
<script src="js/voting.js"></script>
<!-- Uses config -->
```

### 2. Config Usage

In `js/voting.js`, the configuration is accessed:

```javascript
const config = window.APP_CONFIG || {
  API_BASE_URL: "http://localhost:3000/api",
  API_URL: "http://localhost:3000",
};

this.baseURL = config.API_BASE_URL;
this.socketURL = config.API_URL;
```

### 3. Fallback

If `config.js` is not loaded, the code falls back to localhost URLs.

## Testing the Configuration

### 1. Check if config is loaded

Open browser console and type:

```javascript
console.log(window.APP_CONFIG);
```

You should see:

```javascript
{
  API_URL: "http://localhost:3000",
  API_BASE_URL: "http://localhost:3000/api",
  ENV: "development",
  // ... other settings
}
```

### 2. Test API connection

In browser console:

```javascript
fetch(window.APP_CONFIG.API_BASE_URL + "/voting/contestants")
  .then((r) => r.json())
  .then((data) => console.log("API Response:", data));
```

### 3. Check WebSocket connection

Look for this message in console:

```
✅ Connected to voting server
```

## Different Deployment Scenarios

### Scenario 1: Same Domain (Frontend and Backend)

```javascript
// Both on example.com
API_URL: 'https://example.com',
API_BASE_URL: 'https://example.com/api'
```

### Scenario 2: Subdomain for API

```javascript
// Frontend: example.com
// Backend: api.example.com
API_URL: 'https://api.example.com',
API_BASE_URL: 'https://api.example.com/api'
```

### Scenario 3: Different Domains

```javascript
// Frontend: mymemes.com
// Backend: mybackend.com
API_URL: 'https://mybackend.com',
API_BASE_URL: 'https://mybackend.com/api'
```

**Important:** For Scenario 3, make sure CORS is properly configured on the backend!

## Backend CORS Configuration

Your backend needs to allow requests from your frontend domain.

### In your backend `.env` file:

```env
FRONTEND_URL=https://your-frontend-domain.com
```

### In your backend CORS setup:

```javascript
const cors = require("cors");
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
```

## Troubleshooting

### Issue: "Failed to fetch" or Network Error

**Possible Causes:**

1. Backend server is not running
2. Wrong URL in config.js
3. CORS not configured on backend
4. Firewall blocking requests

**Solutions:**

1. Verify backend is running: `curl http://localhost:3000/api/voting/contestants`
2. Check URL in browser: Open `http://localhost:3000/api/voting/contestants`
3. Check browser console for CORS errors
4. Update backend CORS settings

### Issue: WebSocket not connecting

**Possible Causes:**

1. Socket.IO not loaded
2. Wrong socket URL
3. Backend WebSocket not configured

**Solutions:**

1. Check if Socket.IO script is loaded: Look for `<script src="/socket.io/socket.io.js"></script>`
2. Verify socket URL in config
3. Check backend has Socket.IO set up

### Issue: Config not found

**Error:** `Cannot read property 'API_BASE_URL' of undefined`

**Solution:**
Make sure `config.js` is loaded before `voting.js` in HTML:

```html
<script src="js/config.js"></script>
<!-- Must be first -->
<script src="js/voting.js"></script>
```

## Environment Variables (Optional)

For projects using build tools (Vite, Webpack, etc.), you can use `.env` files:

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Update values in `.env.local`:

   ```env
   VITE_API_URL=http://localhost:3000
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

3. Access in your build config to inject into `config.js`

**Note:** For static hosting (without build tools), just edit `config.js` directly.

## Security Checklist

- [ ] Never commit `.env` files to git (they're in `.gitignore`)
- [ ] Use HTTPS in production
- [ ] Configure CORS properly on backend
- [ ] Don't expose sensitive API keys in frontend code
- [ ] Use environment-specific configs (dev/prod)

## Deployment Checklist

Before deploying:

- [ ] Update `API_URL` in `config.js`
- [ ] Update `API_BASE_URL` in `config.js`
- [ ] Change `ENV` to `'production'`
- [ ] Test API connection
- [ ] Test WebSocket connection
- [ ] Verify CORS is working
- [ ] Check all features work (voting, etc.)

## Need Help?

If you encounter issues:

1. **Check browser console** for errors
2. **Check network tab** to see API requests
3. **Verify backend is running** and accessible
4. **Test API manually** with curl or Postman
5. **Review CORS configuration** on backend

## Summary

✅ **Development:** Everything is pre-configured for localhost:3000

✅ **Production:** Just update 3 values in `js/config.js`:

- `API_URL`
- `API_BASE_URL`
- `ENV`

✅ **Deployment:** Upload all files including `config.js`

That's it! Your frontend is now configured to connect to your backend. 🎉
