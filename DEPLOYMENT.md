# WriterPod Deployment Guide

## Prerequisites
1. Vercel account (https://vercel.com)
2. MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
3. GitHub account

## Deployment Steps

### 1. Prepare Environment Variables

#### Backend Environment Variables (.env)
Create `/backend/.env` with:
```
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=https://your-frontend-url.vercel.app
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

#### Frontend Environment Variables
The frontend uses `REACT_APP_API_URL` which will be set in Vercel dashboard.

### 2. GitHub Setup
```bash
# Add and commit all changes
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 3. Vercel Deployment

#### Deploy Backend First
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory to `/backend`
5. Add environment variables in Vercel dashboard
6. Deploy and note the URL (e.g., `writerpod-backend.vercel.app`)

#### Deploy Frontend
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory to `/frontend`
5. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-backend-url.vercel.app/api`
6. Deploy

### 4. Update CORS Settings
After deploying the frontend, update your backend CORS settings in `/backend/server.js` to include your frontend Vercel URL:
```javascript
const allowedOrigins = [
  'https://your-frontend-url.vercel.app',
  'http://localhost:3000',
  // ... other origins
];
```

### 5. MongoDB Atlas Configuration
1. In MongoDB Atlas dashboard:
   - Go to Network Access
   - Add your Vercel deployment IP addresses
   - Or add `0.0.0.0/0` for development (not recommended for production)

## Project Structure for Vercel
```
WriterPod/
├── backend/
│   ├── server.js
│   ├── vercel.json
│   └── package.json
├── frontend/
│   ├── build/
│   ├── src/
│   └── package.json
├── vercel.json (root config)
└── README.md
```

## Environment Variables Reference

### Backend (.env)
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `ELEVENLABS_API_KEY`: ElevenLabs API key for TTS
- `FRONTEND_URL`: Your frontend Vercel URL
- `PORT`: Port (Vercel sets automatically)

### Frontend (Vercel Environment Variables)
- `REACT_APP_API_URL`: Your backend Vercel URL + `/api`

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Make sure your frontend URL is in the allowedOrigins array
2. **Environment Variables**: Double-check all variables are set correctly in Vercel dashboard
3. **Build Failures**: Check logs in Vercel dashboard for specific error messages
4. **API Connection**: Ensure frontend REACT_APP_API_URL points to the correct backend URL

### Useful Commands:
```bash
# Test backend locally
cd backend && npm run dev

# Test frontend locally
cd frontend && npm start

# Build frontend for production
cd frontend && npm run build
```

## Next Steps
1. Set up custom domains in Vercel dashboard
2. Configure monitoring and analytics
3. Set up CI/CD for automatic deployments
4. Add proper error logging and monitoring