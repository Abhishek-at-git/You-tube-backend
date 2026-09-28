# 📺 YouTube Clone — Backend API

A production-ready REST API backend for a YouTube-like platform, built with **Node.js**, **Express**, **MongoDB**, **Cloudinary**, and **JWT authentication**.

---

## 🏗️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Node.js** | Runtime environment |
| **Express v5** | Web framework |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **Bcrypt** | Password hashing |
| **Cloudinary** | Cloud media storage (videos, images) |
| **Multer** | File upload middleware |
| **dotenv** | Environment variable management |
| **Nodemon** | Development auto-reload |

---

## 📁 Project Structure

```
backend main/
├── public/
│   └── temp/                        # Temporary local file storage (Multer)
├── src/
│   ├── index.js                     # Entry point — DB connect + server start
│   ├── app.js                       # Express app setup, CORS, middleware, routes
│   ├── constants.js                 # App-wide constants (DB_NAME, PORT)
│   │
│   ├── db/
│   │   └── index.js                 # MongoDB connection via Mongoose
│   │
│   ├── models/
│   │   ├── user.model.js            # User schema (auth, avatar, watchHistory)
│   │   ├── video.model.js           # Video schema (Cloudinary URLs, views, owner)
│   │   ├── comment.model.js         # Comment schema (content, video ref, owner)
│   │   ├── like.model.js            # Like schema (video | comment | tweet + likedBy)
│   │   ├── playlist.model.js        # Playlist schema (name, videos[], owner)
│   │   ├── subscription.model.js    # Subscription schema (subscriber → channel)
│   │   └── tweet.model.js           # Tweet schema (content, owner)
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT verification — protects secured routes
│   │   └── multer.middleware.js     # Multer disk storage config for file uploads
│   │
│   ├── utils/
│   │   ├── apierror.js              # Custom ApiError class (extends Error)
│   │   ├── apiresponce.js           # Standardized ApiResponse class
│   │   ├── asynchandler.js          # Async wrapper (eliminates try-catch boilerplate)
│   │   └── cloudinary.js            # Cloudinary upload & delete helpers
│   │
│   ├── controller/
│   │   ├── user.controller.js       # User CRUD, auth, channel profile, watch history
│   │   ├── video.controller.js      # Video CRUD, publish, toggle, views
│   │   ├── comment.controller.js    # Comment CRUD with pagination
│   │   ├── like.controller.js       # Toggle likes on video/comment/tweet
│   │   ├── playlist.controller.js   # Playlist CRUD, add/remove videos
│   │   ├── subscription.controller.js # Subscribe/unsubscribe, list subscribers
│   │   ├── tweet.controller.js      # Tweet CRUD
│   │   ├── dashboard.controller.js  # Channel stats & video analytics
│   │   └── healthcheck.controller.js # API health status
│   │
│   └── routes/
│       ├── user.routes.js           # /api/v1/users/*
│       ├── video.routes.js          # /api/v1/videos/*
│       ├── comment.routes.js        # /api/v1/comments/*
│       ├── like.routes.js           # /api/v1/likes/*
│       ├── playlist.routes.js       # /api/v1/playlist/*
│       ├── subscription.routes.js   # /api/v1/subscriptions/*
│       ├── tweet.routes.js          # /api/v1/tweets/*
│       ├── dashboard.routes.js      # /api/v1/dashboard/*
│       └── healthcheck.routes.js    # /api/v1/healthcheck
│
├── .env                             # Environment variables (git-ignored)
├── .env.sample                      # Sample env template
├── .gitignore
├── .prettierrc
├── package.json
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root based on `.env.sample`:

```env
PORT=3000

MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net

CORS_ORIGIN=*

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRATION=1d

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRATION=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd "backend main"

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.sample .env
# Fill in your values in .env

# 4. Create temp directory for file uploads
mkdir -p public/temp

# 5. Start the development server
npm run dev
```

Server starts at: **http://localhost:3000**

---

## 🔐 Authentication

This API uses **JWT (JSON Web Tokens)** with a dual-token strategy:

| Token | Expiry | Stored In |
|-------|--------|-----------|
| **Access Token** | 1 day | Cookie (`accessToken`) + Response body |
| **Refresh Token** | 7 days | Cookie (`refreshToken`) + MongoDB |

### How to Authenticate
1. Register or login to receive `accessToken` and `refreshToken`
2. For protected routes, send the token as:
   - **Cookie**: `accessToken=<token>` (automatic if using a browser)
   - **Header**: `Authorization: Bearer <token>`

---

## 📌 API Reference

Base URL: `http://localhost:3000/api/v1`

### 🏥 Healthcheck

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/healthcheck` | ❌ | Check if the server is running |

**Response:**
```json
{
  "statusCode": 200,
  "data": { "status": "OK" },
  "message": "Server is healthy",
  "success": true
}
```

---

### 👤 Users — `/api/v1/users`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/register` | ❌ | Register a new user |
| `POST` | `/login` | ❌ | Login with email/username |
| `POST` | `/logout` | ✅ | Logout current user |
| `POST` | `/refresh-token` | ❌ | Refresh the access token |
| `POST` | `/change-password` | ✅ | Change current password |
| `GET` | `/current-user` | ✅ | Get logged-in user's profile |
| `PATCH` | `/update-account` | ✅ | Update fullName and email |
| `PATCH` | `/avatar` | ✅ | Update profile avatar |
| `PATCH` | `/cover-image` | ✅ | Update channel cover image |
| `GET` | `/c/:username` | ✅ | Get public channel profile |
| `GET` | `/history` | ✅ | Get watch history |

#### Register User — `POST /users/register`
- **Content-Type**: `multipart/form-data`
- **Body Fields**:
  ```
  fullName    (string, required)
  email       (string, required)
  username    (string, required)
  password    (string, required)
  avatar      (file, required)
  coverImage  (file, optional)
  ```

#### Login User — `POST /users/login`
- **Body** (JSON):
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```

---

### 🎬 Videos — `/api/v1/videos`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/` | ✅ | Get all videos (search, sort, paginate) |
| `POST` | `/` | ✅ | Upload and publish a video |
| `GET` | `/:videoId` | ✅ | Get a single video by ID |
| `PATCH` | `/:videoId` | ✅ | Update video title, description, or thumbnail |
| `DELETE` | `/:videoId` | ✅ | Delete a video |
| `PATCH` | `/toggle/publish/:videoId` | ✅ | Toggle published/unpublished status |

#### Get All Videos — Query Params:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page |
| `query` | string | — | Search in title/description |
| `sortBy` | string | `createdAt` | Field to sort by |
| `sortType` | string | `desc` | `asc` or `desc` |
| `userId` | string | — | Filter by owner |

#### Publish Video — `POST /videos`
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```
  title       (string, required)
  description (string, required)
  videoFile   (file, required)
  thumbnail   (file, required)
  ```

---

### 💬 Comments — `/api/v1/comments`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/:videoId` | ✅ | Get paginated comments for a video |
| `POST` | `/:videoId` | ✅ | Add a comment to a video |
| `PATCH` | `/c/:commentId` | ✅ | Update a comment (owner only) |
| `DELETE` | `/c/:commentId` | ✅ | Delete a comment (owner only) |

#### Get Comments — Query Params:
| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `10` | Items per page |

---

### ❤️ Likes — `/api/v1/likes`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/toggle/v/:videoId` | ✅ | Toggle like/unlike on a video |
| `POST` | `/toggle/c/:commentId` | ✅ | Toggle like/unlike on a comment |
| `POST` | `/toggle/t/:tweetId` | ✅ | Toggle like/unlike on a tweet |
| `GET` | `/videos` | ✅ | Get all videos liked by current user |

> Toggle endpoints return `{ isLiked: true }` or `{ isLiked: false }`.

---

### 📋 Playlists — `/api/v1/playlist`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/` | ✅ | Create a new playlist |
| `GET` | `/user/:userId` | ✅ | Get all playlists of a user |
| `GET` | `/:playlistId` | ✅ | Get a playlist with all its videos |
| `PATCH` | `/add/:videoId/:playlistId` | ✅ | Add a video to a playlist |
| `PATCH` | `/remove/:videoId/:playlistId` | ✅ | Remove a video from a playlist |
| `DELETE` | `/:playlistId` | ✅ | Delete a playlist (owner only) |
| `PATCH` | `/:playlistId` | ✅ | Update playlist name/description |

---

### 🔔 Subscriptions — `/api/v1/subscriptions`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/c/:channelId` | ✅ | Subscribe / Unsubscribe to a channel |
| `GET` | `/u/:subscriberId` | ✅ | Get all subscribers of a channel |
| `GET` | `/c/:channelId` | ✅ | Get all channels a user has subscribed to |

> Self-subscribe is blocked — you cannot subscribe to your own channel.

---

### 🐦 Tweets — `/api/v1/tweets`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/` | ✅ | Create a new tweet |
| `GET` | `/user/:userId` | ✅ | Get all tweets by a user |
| `PATCH` | `/:tweetId` | ✅ | Update a tweet (owner only) |
| `DELETE` | `/:tweetId` | ✅ | Delete a tweet (owner only) |

---

### 📊 Dashboard — `/api/v1/dashboard`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/stats` | ✅ | Get channel stats (subscribers, views, videos, likes) |
| `GET` | `/videos` | ✅ | Get all videos uploaded by the logged-in channel |

#### Channel Stats Response:
```json
{
  "statusCode": 200,
  "data": {
    "totalSubscribers": 1500,
    "totalVideos": 42,
    "totalViews": 98340,
    "totalLikes": 4200
  },
  "message": "Channel stats fetched successfully",
  "success": true
}
```

---

## 📦 Data Models

### User
```js
{
  username: String,     // unique, lowercase, indexed
  email: String,        // unique
  fullName: String,
  avatar: String,       // Cloudinary URL (required)
  coverImage: String,   // Cloudinary URL (optional)
  watchHistory: [ObjectId → Video],
  password: String,     // bcrypt hashed
  refreshToken: String
}
```

### Video
```js
{
  videoFile: String,    // Cloudinary URL
  thumbnail: String,    // Cloudinary URL
  title: String,
  description: String,
  duration: Number,     // auto-set from Cloudinary
  views: Number,        // default 0, auto-incremented on fetch
  isPublished: Boolean, // default true
  owner: ObjectId → User
}
```

### Comment
```js
{
  content: String,
  video: ObjectId → Video,
  owner: ObjectId → User
}
```

### Like
```js
{
  video: ObjectId → Video,      // one of these three is set
  comment: ObjectId → Comment,
  tweet: ObjectId → Tweet,
  likedBy: ObjectId → User
}
```

### Playlist
```js
{
  name: String,
  description: String,
  videos: [ObjectId → Video],
  owner: ObjectId → User
}
```

### Subscription
```js
{
  subscriber: ObjectId → User,  // the person subscribing
  channel: ObjectId → User      // the channel being subscribed to
}
```

### Tweet
```js
{
  content: String,
  owner: ObjectId → User
}
```

---

## 🛡️ Security Features

- **Password Hashing** — bcrypt with salt rounds of 10
- **JWT Dual Token** — Short-lived access tokens + long-lived refresh tokens
- **HTTP-Only Cookies** — Tokens stored in secure, httpOnly cookies
- **Ownership Checks** — Update/delete operations verify resource ownership
- **Input Validation** — All required fields validated before DB operations

---

## 🔄 Standard API Response Format

All endpoints return responses in this shape:

```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Operation successful",
  "success": true
}
```

### Error Response Format
```json
{
  "statusCode": 404,
  "data": null,
  "message": "Video not found",
  "success": false,
  "error": []
}
```

### Common HTTP Status Codes
| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / validation error |
| `401` | Unauthorized (invalid/missing token) |
| `403` | Forbidden (not the owner) |
| `404` | Resource not found |
| `409` | Conflict (duplicate username/email) |
| `500` | Internal server error |

---

## 🧪 Testing with Postman

### Quick Start Flow:
1. **Register** — `POST /api/v1/users/register` (multipart with avatar file)
2. **Login** — `POST /api/v1/users/login` → copy `accessToken` from response
3. **Set Auth Header** — `Authorization: Bearer <accessToken>` in Postman Collection vars
4. **Publish Video** — `POST /api/v1/videos` (multipart with videoFile + thumbnail)
5. **Get Videos** — `GET /api/v1/videos`
6. **Like Video** — `POST /api/v1/likes/toggle/v/:videoId`
7. **Comment** — `POST /api/v1/comments/:videoId`
8. **Subscribe** — `POST /api/v1/subscriptions/c/:channelId`
9. **Dashboard** — `GET /api/v1/dashboard/stats`

---

## 📜 Scripts

```bash
# Start development server with hot-reload
npm run dev
```

---

## 📝 License

ISC
