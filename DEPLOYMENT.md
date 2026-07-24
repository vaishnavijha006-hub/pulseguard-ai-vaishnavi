# PulseGuard AI Deployment Guide

## Quick Deployment Steps

### 1. Backend Deployment (Render)

**Prerequisites:**
- MongoDB Atlas account and connection string
- GitHub repository with the code

**Steps:**
1. Go to [Render.com](https://render.com) and create an account
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` configuration
5. **Set Environment Variables** (in Render dashboard):
   - `MONGO_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Generate a secure random string (e.g., `openssl rand -base64 32`)
   - `CLIENT_URL` - Your Vercel frontend URL (after frontend deployment)
   - `JWT_EXPIRES_IN` - `7d` (already set in render.yaml)
   - `NODE_ENV` - `production` (already set in render.yaml)
   - `PORT` - `5000` (already set in render.yaml)

6. Click "Deploy Web Service"
7. Wait for deployment to complete (~2-3 minutes)
8. Copy your Render backend URL (e.g., `https://pulseguard-ai-xxx.onrender.com`)

### 2. Frontend Deployment (Vercel)

**Prerequisites:**
- Render backend URL from step 1
- GitHub repository with the code

**Steps:**
1. Go to [Vercel.com](https://vercel.com) and create an account
2. Click "Add New Project" → "Import Git Repository"
3. Select your repository
4. **Configure Project:**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Set Environment Variable:**
   - Name: `VITE_API_URL`
   - Value: Your Render backend URL + `/api/v1` (e.g., `https://pulseguard-ai-xxx.onrender.com/api/v1`)
   - Environments: Production, Preview, Development

6. Click "Deploy"
7. Wait for deployment to complete (~1-2 minutes)
8. Copy your Vercel frontend URL

### 3. Update Backend CLIENT_URL

1. Go back to your Render dashboard
2. Navigate to your backend service
3. Go to "Environment" section
4. Update `CLIENT_URL` with your Vercel frontend URL
5. Render will automatically redeploy with the new configuration

## Environment Variables Reference

### Backend (Render)
- `MONGO_URI` - MongoDB connection string (required)
- `JWT_SECRET` - JWT signing secret (required)
- `CLIENT_URL` - Frontend URL for CORS (required)
- `JWT_EXPIRES_IN` - Token expiration time (default: `7d`)
- `NODE_ENV` - Environment mode (default: `production`)
- `PORT` - Server port (default: `5000`)

### Frontend (Vercel)
- `VITE_API_URL` - Backend API URL (required)

## Troubleshooting

### Registration/Login Not Working
1. Check that `VITE_API_URL` is set correctly in Vercel
2. Verify backend is running (check Render dashboard)
3. Check browser console for CORS errors
4. Ensure `CLIENT_URL` in Render matches your Vercel URL

### Backend Deployment Fails
1. Check Render logs for specific errors
2. Ensure `MONGO_URI` is valid and accessible
3. Verify `JWT_SECRET` is set
4. Check that Node.js version is compatible (render.yaml specifies 18.20.0)

### Frontend Deployment Fails
1. Check Vercel build logs
2. Ensure `VITE_API_URL` is set before deployment
3. Verify build command runs successfully locally

## Local Development Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your local settings
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your local backend URL
npm run dev
```

## File Changes Made for Deployment

1. **render.yaml** - Render deployment configuration
2. **frontend/.env.example** - Frontend environment variables template
3. **backend/server.js** - Updated CORS to allow all production origins
4. **backend/package.json** - Downgraded nodemailer to stable version
5. **frontend/src/pages/RegisterPage.tsx** - Added error handling
6. **frontend/src/pages/LoginPage.tsx** - Added error handling
