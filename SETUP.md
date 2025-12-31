# Quick Setup Guide

## ⚠️ IMPORTANT: Before Running

### 1. Update Firebase Admin SDK Credentials

Open `server/.env` and replace these values with YOUR Firebase Service Account credentials:

```env
FIREBASE_PROJECT_ID=task-manager-2b634
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Actual_Private_Key_Here\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@task-manager-2b634.iam.gserviceaccount.com
```

**To get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `task-manager-2b634`
3. Click ⚙️ Settings → Project Settings
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file
7. Copy the values:
   - `project_id` → FIREBASE_PROJECT_ID
   - `private_key` → FIREBASE_PRIVATE_KEY (keep the quotes and \n)
   - `client_email` → FIREBASE_CLIENT_EMAIL

### 2. Start MongoDB

Make sure MongoDB is running on your machine:

```bash
# Windows (if installed as service)
net start MongoDB

# Or run manually
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in server/.env with your Atlas connection string
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

Server will start on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Client will start on `http://localhost:5173`

### 4. First Login

1. Open browser: `http://localhost:5173`
2. Click **"Sign in with Google"**
3. Choose your Google account
4. You'll be logged in as a **Member** (default role)

### 5. Make Yourself Admin (Optional)

To access admin features:

```bash
# Connect to MongoDB
mongosh

# Switch to database
use task-manager

# Find your user
db.users.find({email: "your@gmail.com"})

# Update role to Admin
db.users.updateOne(
  {email: "your@gmail.com"}, 
  {$set: {role: "Admin"}}
)

# Refresh your browser
```

## Features to Test

### 1. Follow Ups (Tasks You Assign)
- Click "Follow Ups" in sidebar
- Click "Create Task"
- Fill form and assign to any user
- Edit/delete your tasks

### 2. My Tasks (Tasks Assigned to You)
- Have someone assign a task to you
- Or create a task with another account and assign to yourself
- Update task status using dropdown

### 3. Recurring Tasks
- Click "Recurring Tasks"
- Create a daily/weekly/monthly recurring task
- System will auto-generate tasks (runs at 1 AM daily)
- Test manually by checking MongoDB or waiting for schedule

### 4. Dashboard
- View statistics
- See calendar with all tasks
- Check overdue tasks

## Common Issues

### "No token provided" Error
- Clear browser cache/localStorage
- Sign out and sign in again
- Check Firebase config in `client/.env`

### Server Won't Start
- Check MongoDB is running
- Verify `.env` files exist in both client and server
- Check Firebase Admin SDK credentials

### Tasks Not Showing
- Check browser console for errors
- Check server terminal for errors
- Verify MongoDB connection

### Recurring Tasks Not Generating
- Check server logs at 1 AM
- Verify Agenda.js is running (should see "Agenda scheduler started")
- Check MongoDB collection `agendaJobs`

## Next Steps

✅ Complete setup complete!

Your task manager is ready with:
- ✅ Google Authentication  
- ✅ Task Management (CRUD)
- ✅ Follow Ups (tasks you assigned)
- ✅ My Tasks (tasks assigned to you)
- ✅ Recurring Tasks (auto-generation)
- ✅ Dashboard with Calendar
- ✅ Role-Based Access (Admin/Manager/Member)
- ✅ Sunday skip logic

## Need Help?

Check the main README.md for:
- Full API documentation
- Database schema details
- Architecture overview
- Troubleshooting guide
