# WriterPod Backend API

Node.js/Express backend for the WriterPod Studio platform.

## Features

- **Authentication & User Management**: JWT-based auth with user profiles
- **Story & Chapter Management**: CRUD operations for stories and chapters  
- **Text-to-Speech Integration**: Convert text content to audio
- **Social Features**: Follow users, like/bookmark content, comments
- **Analytics Dashboard**: Track story performance and user engagement
- **File Upload**: Handle cover images and audio files
- **Search & Discovery**: Find stories by genre, author, or text search

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **File Storage**: Multer for uploads

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start MongoDB:**
Make sure MongoDB is running on your system or use a cloud instance.

4. **Run the server:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/writerpod

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Text-to-Speech API
TTS_API_KEY=your_tts_api_key
TTS_API_URL=your_tts_api_url

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# File Upload Limits
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login user | Public |
| GET | `/me` | Get current user profile | Private |
| PUT | `/profile` | Update user profile | Private |
| POST | `/change-password` | Change password | Private |

### Stories (`/api/stories`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all public stories (with filters) | Public |
| GET | `/:id` | Get single story by ID | Public |
| POST | `/` | Create new story | Private |
| PUT | `/:id` | Update story | Private (Owner) |
| DELETE | `/:id` | Delete story | Private (Owner) |
| POST | `/:id/like` | Like/unlike story | Private |
| POST | `/:id/bookmark` | Bookmark/unbookmark story | Private |
| POST | `/:id/rate` | Rate story (1-5 stars) | Private |

### Chapters (`/api/chapters`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/story/:storyId` | Get all chapters for a story | Public |
| GET | `/:id` | Get single chapter by ID | Public |
| POST | `/` | Create new chapter | Private |
| PUT | `/:id` | Update chapter | Private (Owner) |
| DELETE | `/:id` | Delete chapter | Private (Owner) |
| POST | `/:id/like` | Like/unlike chapter | Private |
| POST | `/:id/comment` | Add comment to chapter | Private |
| DELETE | `/:id/comment/:commentId` | Delete comment | Private (Owner) |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get users with search/filters | Public |
| GET | `/:username` | Get user profile by username | Public |
| POST | `/:id/follow` | Follow/unfollow user | Private |
| GET | `/:id/stories` | Get stories by user | Public |
| GET | `/:id/followers` | Get user's followers | Public |
| GET | `/:id/following` | Get users being followed | Public |
| GET | `/me/bookmarks` | Get current user's bookmarks | Private |
| GET | `/me/feed` | Get personalized feed | Private |

### Text-to-Speech (`/api/tts`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/generate` | Generate TTS for text | Private |
| POST | `/chapter/:id` | Generate TTS for chapter | Private (Owner) |
| GET | `/voices` | Get available voices | Private |
| GET | `/background-music` | Get background music options | Private |
| DELETE | `/chapter/:id/audio` | Delete chapter audio | Private (Owner) |

### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard` | Get user dashboard analytics | Private |
| GET | `/story/:id` | Get story analytics | Private (Owner) |
| GET | `/chapter/:id` | Get chapter analytics | Private (Owner) |
| GET | `/audience` | Get audience analytics | Private |

## Request/Response Examples

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Create Story
```bash
POST /api/stories
Authorization: Bearer your_jwt_token
Content-Type: application/json

{
  "title": "My Amazing Story",
  "description": "A thrilling adventure tale",
  "genre": "fantasy",
  "tags": ["adventure", "magic", "hero"],
  "visibility": "public"
}
```

### Create Chapter
```bash
POST /api/chapters
Authorization: Bearer your_jwt_token
Content-Type: application/json

{
  "title": "Chapter 1: The Beginning",
  "content": "Once upon a time, in a land far away...",
  "story": "story_id_here",
  "chapterNumber": 1,
  "status": "published"
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Database Schema

### User
- Profile information and settings
- Statistics (followers, stories, views)
- Following/followers relationships

### Story
- Title, description, genre, tags
- Author reference and visibility settings
- Statistics and ratings
- Chapters array reference

### Chapter
- Content, title, chapter number
- Story and author references
- Audio file and settings
- Comments and likes
- View statistics and metadata

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Validate all user inputs
- **CORS Protection**: Cross-origin resource sharing controls
- **Helmet Security**: Various security headers
- **Password Hashing**: Bcrypt for secure password storage

## Development

### Project Structure
```
backend/
├── config/          # Database configuration
├── controllers/     # Route controllers (if needed)
├── middleware/      # Custom middleware (auth, etc.)
├── models/          # Mongoose schemas
├── routes/          # API route definitions
├── uploads/         # File upload directory
├── utils/           # Utility functions
├── server.js        # Main application entry point
└── package.json     # Dependencies and scripts
```

### Adding New Features
1. Create model in `models/` if needed
2. Add routes in `routes/`
3. Add middleware if required
4. Update this documentation

## Text-to-Speech Integration

The current TTS implementation is a placeholder. To integrate with a real TTS service:

1. **Choose a TTS provider** (ElevenLabs, Google Cloud TTS, AWS Polly)
2. **Update the `generateSpeech` function** in `routes/textToSpeech.js`
3. **Add your API credentials** to environment variables
4. **Handle audio file storage** and streaming

## Deployment

For production deployment:

1. **Set environment variables** appropriately
2. **Use a process manager** like PM2
3. **Set up reverse proxy** (Nginx)
4. **Use MongoDB Atlas** or managed database
5. **Configure file storage** (AWS S3, etc.)
6. **Set up monitoring** and logging

## API Health Check

Check if the API is running:
```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "message": "WriterPod API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
