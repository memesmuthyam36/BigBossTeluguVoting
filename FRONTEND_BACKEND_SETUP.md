# Frontend-Backend Connection Setup

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Client)                            │
│                                                                   │
│  ┌───────────────┐                                               │
│  │ voting.html   │  Loads scripts in order:                     │
│  └───────┬───────┘                                               │
│          │                                                        │
│          ├──> 1. config.js      (Configuration)                 │
│          │       └─> window.APP_CONFIG = {...}                  │
│          │                                                        │
│          ├──> 2. main.js        (Common functions)              │
│          │                                                        │
│          ├──> 3. voting.js      (Voting logic)                  │
│          │       └─> Uses window.APP_CONFIG                     │
│          │       └─> Connects to backend                        │
│          │                                                        │
│          └──> 4. social-share.js (Social features)              │
│                                                                   │
└───────────────────────────────┬─────────────────────────────────┘
                                 │
                                 │ HTTP/WebSocket
                                 │
                    ┌────────────▼────────────┐
                    │  API_BASE_URL           │
                    │  (Configured in         │
                    │   config.js)            │
                    └────────────┬────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────┐
│                     BACKEND (Server)                              │
│                                                                   │
│  Running on: http://localhost:3000 (dev)                        │
│              https://your-backend.com (prod)                     │
│                                                                   │
│  ┌─────────────────────────────────────────────┐               │
│  │  REST API Endpoints:                         │               │
│  │  • GET  /api/voting/contestants              │               │
│  │  • GET  /api/voting/status                   │               │
│  │  • POST /api/voting/submit                   │               │
│  └─────────────────────────────────────────────┘               │
│                                                                   │
│  ┌─────────────────────────────────────────────┐               │
│  │  WebSocket (Socket.IO):                      │               │
│  │  • Real-time vote updates                    │               │
│  │  • Event: 'voteUpdate'                       │               │
│  └─────────────────────────────────────────────┘               │
│                                                                   │
│  ┌─────────────────────────────────────────────┐               │
│  │  Database (MongoDB):                         │               │
│  │  • Contestants collection                    │               │
│  │  • Votes collection                          │               │
│  └─────────────────────────────────────────────┘               │
└───────────────────────────────────────────────────────────────┘
```

## Configuration Flow

### Development Setup

```
┌──────────────────────────────────────────────────────────┐
│  js/config.js                                            │
│  ────────────                                            │
│  const CONFIG = {                                        │
│    API_URL: 'http://localhost:3000',          ← Default │
│    API_BASE_URL: 'http://localhost:3000/api', ← Default │
│    ENV: 'development'                         ← Default │
│  }                                                        │
└──────────────────────────────────────────────────────────┘
                          ↓
                   No changes needed!
                   Just start backend
```

### Production Setup

```
┌──────────────────────────────────────────────────────────┐
│  js/config.js                                            │
│  ────────────                                            │
│  const CONFIG = {                                        │
│    API_URL: 'https://api.example.com',        ← Update  │
│    API_BASE_URL: 'https://api.example.com/api',← Update │
│    ENV: 'production'                          ← Update  │
│  }                                                        │
└──────────────────────────────────────────────────────────┘
                          ↓
                   Deploy frontend
```

## Files Structure

```
client/
├── .env.example               ← Template (don't edit)
├── .gitignore                 ← .env files ignored
├── SETUP_INSTRUCTIONS.md      ← Quick start guide
├── ENV_CONFIG_README.md       ← Detailed config guide
├── FRONTEND_BACKEND_SETUP.md  ← This file
│
├── voting.html                ← Updated
│   └── Includes config.js
│
├── js/
│   ├── config.js             ← NEW: Configuration file ⭐
│   ├── voting.js             ← Updated to use config ✓
│   ├── main.js
│   └── social-share.js
│
├── css/
│   ├── style.css
│   └── voting.css
│
└── images/
    └── ...
```

## Data Flow Example: Voting

```
1. User clicks "Vote" button
        ↓
2. voting.js checks config
        ↓
   Uses: window.APP_CONFIG.API_BASE_URL
         → http://localhost:3000/api
        ↓
3. Makes POST request
        ↓
   POST http://localhost:3000/api/voting/submit
   Body: { contestantId: "123" }
        ↓
4. Backend processes vote
        ↓
5. Backend sends WebSocket update
        ↓
   Event: 'voteUpdate'
   Data: { contestantId: "123", newVoteCount: 2457, ... }
        ↓
6. Frontend receives update
        ↓
7. UI updates automatically
```

## WebSocket Connection Flow

```
┌──────────────┐
│ voting.js    │  1. Loads Socket.IO library
│ constructor  │     if not already loaded
└──────┬───────┘
       │
       ↓  2. Calls initializeSocket()
┌──────────────┐
│ initialize   │  3. Gets socket URL from config
│ Socket()     │     → window.APP_CONFIG.API_URL
└──────┬───────┘
       │
       ↓  4. Connects to server
┌──────────────┐
│ connectSocket│  io(this.socketURL)
│ ()           │  → io("http://localhost:3000")
└──────┬───────┘
       │
       ↓  5. Listens for events
┌──────────────┐
│ socket.on()  │  • 'connect'
│              │  • 'voteUpdate'
│              │  • 'disconnect'
└──────────────┘
```

## Configuration Hierarchy

```
Priority (Highest to Lowest):
1. window.APP_CONFIG (from config.js)
2. Fallback defaults in voting.js

Example in voting.js:
────────────────────
const config = window.APP_CONFIG || {
  API_BASE_URL: "http://localhost:3000/api",
  API_URL: "http://localhost:3000"
};
```

## Environment-Specific Configurations

### Local Development

```javascript
API_URL: "http://localhost:3000";
API_BASE_URL: "http://localhost:3000/api";
ENV: "development";
```

### Staging

```javascript
API_URL: "https://staging-api.example.com";
API_BASE_URL: "https://staging-api.example.com/api";
ENV: "staging";
```

### Production

```javascript
API_URL: "https://api.example.com";
API_BASE_URL: "https://api.example.com/api";
ENV: "production";
```

## CORS Configuration

### Frontend → Backend Request

```
┌──────────────┐
│  Frontend    │  Request from: http://localhost:8080
│              │  ──────────────────────────────────────>
│  (Origin)    │                                         │
└──────────────┘                                         ↓
                                              ┌──────────────────┐
                                              │   Backend        │
                                              │                  │
                                              │ CORS Check:      │
                                              │ Origin allowed?  │
                                              │ ✓ Yes            │
                                              │ ← FRONTEND_URL   │
                                              │   from .env      │
                                              └──────────────────┘
                                                       │
┌──────────────┐                                      │
│  Frontend    │  <───────────────────────────────────┘
│              │  Response with CORS headers
│  (Success)   │  Access-Control-Allow-Origin: http://localhost:8080
└──────────────┘
```

### Backend .env Configuration

```env
# Backend .env file
FRONTEND_URL=http://localhost:8080        # Development
# FRONTEND_URL=https://example.com         # Production
```

## Deployment Scenarios

### Scenario 1: Static Hosting (Netlify, Vercel, etc.)

```
Step 1: Edit js/config.js locally
        ↓
Step 2: Set production URLs
        ↓
Step 3: Deploy frontend
        ↓
Result: Frontend connects to production backend
```

### Scenario 2: Same Server (Frontend + Backend)

```
Example: example.com
├── /              → Frontend (HTML/CSS/JS)
└── /api           → Backend API

config.js:
API_URL: 'https://example.com'
API_BASE_URL: 'https://example.com/api'
```

### Scenario 3: Different Domains

```
Frontend: app.example.com
Backend:  api.example.com

config.js:
API_URL: 'https://api.example.com'
API_BASE_URL: 'https://api.example.com/api'

⚠️ Important: Configure CORS on backend!
```

## Testing Your Setup

### 1. Open Browser Console

```javascript
// Check if config is loaded
console.log(window.APP_CONFIG);

// Expected output:
// {
//   API_URL: "http://localhost:3000",
//   API_BASE_URL: "http://localhost:3000/api",
//   ENV: "development",
//   ...
// }
```

### 2. Test API Connection

```javascript
// Test API endpoint
fetch(window.APP_CONFIG.API_BASE_URL + "/voting/contestants")
  .then((r) => r.json())
  .then((data) => console.log("✓ API Working:", data))
  .catch((err) => console.error("✗ API Error:", err));
```

### 3. Check WebSocket

```javascript
// Look for this in console:
// ✅ Connected to voting server

// If you see this, WebSocket is working!
```

## Common Issues & Solutions

### Issue: Config undefined

```
Error: Cannot read property 'API_BASE_URL' of undefined

Solution:
─────────
Check if config.js is loaded before voting.js in HTML:
<script src="js/config.js"></script>  ← Must be first
<script src="js/voting.js"></script>
```

### Issue: CORS Error

```
Error: Access to fetch has been blocked by CORS policy

Solution:
─────────
1. Check backend CORS configuration
2. Verify FRONTEND_URL in backend .env
3. Ensure origin matches exactly
```

### Issue: 404 Not Found

```
Error: GET http://localhost:3000/api/voting/contestants 404

Solution:
─────────
1. Check backend is running
2. Verify API endpoints exist
3. Check URL format in config.js
```

## Quick Reference

| Task                 | Edit This File  | What to Change                   |
| -------------------- | --------------- | -------------------------------- |
| Change backend URL   | `js/config.js`  | `API_URL` and `API_BASE_URL`     |
| Switch to production | `js/config.js`  | Set `ENV: 'production'`          |
| Configure CORS       | Backend `.env`  | Set `FRONTEND_URL`               |
| Test configuration   | Browser console | `console.log(window.APP_CONFIG)` |

## Summary

✅ **Configuration file**: `js/config.js`
✅ **Updated files**: `voting.js`, `voting.html`
✅ **Documentation**: This file + SETUP_INSTRUCTIONS.md
✅ **Environment**: Development ready, production configurable
✅ **Connection**: HTTP + WebSocket configured

**Next Steps:**

1. Start your backend server
2. Open `voting.html` in browser
3. Check console for "✅ Connected to voting server"
4. Test voting functionality

That's it! Your frontend is now properly configured to connect to your backend. 🚀
