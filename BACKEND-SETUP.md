# Quick Setup Guide - Fix Backend Connection

## Problem
The backend server needs Firebase Admin SDK credentials to verify user authentication.

## Solution - 3 Steps

### Step 1: Get Firebase Admin SDK Credentials

1. Open this link: https://console.firebase.google.com/project/tasktapper/settings/serviceaccounts/adminsdk
2. Click the "Generate new private key" button
3. Click "Generate key" in the confirmation dialog
4. Save the downloaded JSON file (e.g., `serviceAccountKey.json`)

### Step 2: Update Server Configuration

**Option A - Using the setup script (Recommended):**
```powershell
cd server
node setup-firebase.js path\to\serviceAccountKey.json
```

**Option B - Manual update:**
Open `server/.env` and replace these lines with values from your downloaded JSON:
```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### Step 3: Start MongoDB and Server

**Start MongoDB:**
```powershell
# If MongoDB is installed as a service
net start MongoDB

# OR if using mongod directly
mongod --dbpath="C:\data\db"
```

**Start the backend server:**
```powershell
cd server
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
✅ Agenda scheduler started
🚀 Server running on port 5000
```

### Step 4: Test the Application

1. Make sure the frontend is running: `cd client && npm run dev`
2. Open http://localhost:5173
3. Click "Sign in with Google"
4. You should now be redirected to the dashboard after successful login

## Troubleshooting

### MongoDB not running
```powershell
# Check if MongoDB service exists
Get-Service -Name MongoDB

# Start the service
net start MongoDB
```

If MongoDB is not installed, you can:
- Download from https://www.mongodb.com/try/download/community
- OR use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
  - Update `MONGODB_URI` in `server/.env` with your Atlas connection string

### Port 5000 already in use
Change the PORT in `server/.env`:
```
PORT=5001
```

And update the API URL in `client/.env`:
```
VITE_API_URL=http://localhost:5001/api
```

## What's Happening

1. **Frontend (React)**: Handles Google sign-in via Firebase Client SDK
2. **Backend (Express)**: Verifies the Firebase token using Firebase Admin SDK
3. **Database (MongoDB)**: Stores user and task data
4. **Auth Flow**: 
   - User clicks "Sign in with Google"
   - Firebase authenticates the user
   - Frontend sends the token to backend `/api/auth/login`
   - Backend verifies token and creates/updates user in MongoDB
   - User is redirected to dashboard
