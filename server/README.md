# Memes Muthyam - Backend Server

This is the Node.js backend server for the Memes Muthyam blog website, providing real-time data synchronization with MongoDB.

## Features

- **Real-time Voting System**: WebSocket integration for live vote updates
- **Blog Management**: CRUD operations for blog posts with view/share tracking
- **Comment System**: User comments with moderation features
- **Rate Limiting**: Protection against spam and abuse
- **CORS Configuration**: Secure cross-origin requests
- **MongoDB Integration**: Persistent data storage with Mongoose

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication (ready for future implementation)

## API Endpoints

### Voting System

- `GET /api/voting/contestants` - Get all active contestants
- `POST /api/voting/submit` - Submit a vote
- `GET /api/voting/status` - Check voting status for current IP
- `GET /api/voting/stats` - Get voting statistics

### Blog System

- `GET /api/blog/posts` - Get blog posts (with pagination)
- `GET /api/blog/featured` - Get featured posts
- `GET /api/blog/post/:slug` - Get single blog post
- `POST /api/blog/post/:slug/share` - Track post share
- `POST /api/blog/post/:slug/comment` - Submit comment

### General

- `GET /api/health` - Health check endpoint

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the project root:

   ```env
   MONGODB_URI=mongodb://localhost:27017/memes-muthyam
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-here
   FRONTEND_URL=http://localhost:8080
   ```

3. **Database Setup**

   ```bash
   # For MongoDB Atlas, update MONGODB_URI in .env file
   # For local MongoDB, ensure MongoDB is running
   ```

4. **Seed Database** (Optional)

   ```bash
   node server/scripts/seedData.js
   ```

5. **Start Server**

   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

### Development

The server will start on `http://localhost:3000` by default.

**Development features:**

- Hot reload with nodemon
- CORS enabled for frontend development
- Detailed error logging
- WebSocket debugging

## Database Schema

### Contestants Collection

```javascript
{
  name: String,
  description: String,
  image: String,
  votes: Number (default: 0),
  isActive: Boolean,
  season: String,
  socialLinks: {
    instagram: String,
    twitter: String,
    facebook: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Votes Collection

```javascript
{
  contestantId: ObjectId (ref: Contestant),
  voterIp: String,
  voteDate: Date,
  dayKey: String, // Format: YYYY-MM-DD-IP
  isValid: Boolean,
  source: String
}
```

### Blog Posts Collection

```javascript
{
  title: String,
  slug: String (unique),
  content: String,
  excerpt: String,
  featuredImage: String,
  category: String,
  tags: [String],
  author: String,
  viewCount: Number,
  shareCount: Number,
  isPublished: Boolean,
  isFeatured: Boolean,
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Real-time Features

### WebSocket Events

**Client → Server:**

- `subscribe-voting` - Subscribe to voting updates
- `subscribe-blog` - Subscribe to blog updates

**Server → Client:**

- `voteUpdate` - Real-time vote count updates
- `postView` - Blog post view count updates
- `postShare` - Blog post share count updates
- `newComment` - New comment notifications

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Voting**: 5 requests per minute per IP
- **Comments**: 5 comments per 15 minutes per IP

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Configured for specific origins
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Request validation
- **IP Tracking**: Vote fraud prevention

## Deployment

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/memes-muthyam
PORT=3000
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-domain.com
```

### PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start server/server.js --name "memes-muthyam-api"
pm2 save
pm2 startup
```

## Monitoring & Logs

The server includes comprehensive logging for:

- Database connections
- API requests
- WebSocket connections
- Error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
