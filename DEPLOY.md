# Deployment Guide for Vercel

## Quick Deploy to Vercel

### Prerequisites
- Vercel account (sign up at https://vercel.com)
- GitHub/GitLab/Bitbucket account
- MongoDB Atlas account (for production database)

### 1. Prepare MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Create a database user
4. Whitelist all IPs (0.0.0.0/0) for development
5. Get connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/task-manager`

### 2. Prepare Firebase for Production

1. Go to Firebase Console
2. Add your Vercel domain to Authorized domains:
   - Authentication → Settings → Authorized domains
   - Add: `your-app.vercel.app`
3. Keep your Firebase credentials ready

### 3. Deploy to Vercel

#### Option A: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd d:\denzo
vercel
```

#### Option B: Via GitHub + Vercel Dashboard

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/task-manager.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

### 4. Set Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

#### For Server (API):
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/task-manager
CORS_ORIGIN=https://your-app.vercel.app
FIREBASE_PROJECT_ID=task-manager-2b634
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@task-manager-2b634.iam.gserviceaccount.com
```

#### For Client (Frontend):
```
VITE_API_URL=https://your-app.vercel.app/api
VITE_FIREBASE_API_KEY=AIzaSyAec8dMhHM3HlXwUlo30C_Vkz__6a9cKfQ
VITE_FIREBASE_AUTH_DOMAIN=task-manager-2b634.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=task-manager-2b634
VITE_FIREBASE_STORAGE_BUCKET=task-manager-2b634.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=636422952834
VITE_FIREBASE_APP_ID=1:636422952834:web:0e893dfea2f232ec52219b
VITE_FIREBASE_MEASUREMENT_ID=G-ETQZLZFN81
```

### 5. Update Client Build Script

The `client/package.json` should have:
```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "npm run build"
  }
}
```

### 6. Deploy

```bash
vercel --prod
```

Or push to GitHub and Vercel will auto-deploy.

### 7. Post-Deployment

1. **Update Firebase Authorized Domains:**
   - Add your Vercel URL to Firebase Console

2. **Update CORS Origin:**
   - Ensure `CORS_ORIGIN` in server env matches your Vercel URL

3. **Test the Application:**
   - Open your Vercel URL
   - Test login with Google
   - Create tasks
   - Verify recurring tasks scheduler is working

## Troubleshooting

### Serverless Functions Timeout
Vercel has a 10-second timeout for serverless functions. If Agenda.js jobs timeout:
- Consider using Vercel Cron Jobs instead
- Or deploy backend separately to Render/Railway

### MongoDB Connection Issues
- Whitelist Vercel IPs in MongoDB Atlas
- Or allow all IPs: 0.0.0.0/0

### Firebase Auth Not Working
- Check authorized domains in Firebase Console
- Verify API keys in environment variables

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set

## Alternative Deployment Options

### Backend Only to Railway/Render
If Agenda.js doesn't work well on Vercel:

**Railway:**
```bash
railway login
railway init
railway up
```

**Render:**
- Connect GitHub repo
- Create Web Service
- Add environment variables
- Deploy

### Frontend to Vercel, Backend Elsewhere
Update `VITE_API_URL` to point to your backend URL.

## Local Testing Before Deploy

```bash
# Build client
cd client
npm run build

# Test production build
npm run preview

# Test server in production mode
cd ../server
NODE_ENV=production npm start
```

## Vercel Configuration Explained

The `vercel.json` file:
- Builds server as Node.js serverless function
- Builds client as static site
- Routes `/api/*` to server
- Routes everything else to client
- Sets production environment

## Need Help?

- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Firebase: https://firebase.google.com/docs/hosting

---

Your task manager is now ready for production! 🚀
