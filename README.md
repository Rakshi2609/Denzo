# Task Manager - MERN Stack with Firebase Authentication

A full-stack task management application built with MongoDB, Express, React, and Node.js (MERN), featuring Firebase Google Authentication and automated recurring tasks.

## Features

- 🔐 **Google Authentication** via Firebase
- ✅ **Task Management** (Create, Assign, Update, Delete)
- 📊 **Dashboard** with Calendar View & Statistics
- 🔄 **Recurring Tasks** with automated generation (skips Sundays)
- 📝 **Task Comments** (Creator + Assigned User only)
- 👥 **Role-Based Access Control** (Admin, Manager, Member)
- 📅 **Follow Ups** - Track tasks you assigned to others
- 🎯 **My Tasks** - View tasks assigned to you

## Tech Stack

### Frontend
- React 19 with Vite
- Tailwind CSS
- Firebase Client SDK
- React Router DOM
- React Big Calendar
- Axios
- React Hook Form + Yup
- React Hot Toast

### Backend
- Node.js + Express
- MongoDB with Mongoose
- Firebase Admin SDK
- Agenda.js (Task Scheduler)
- JWT Authentication

## Project Structure

```
denzo/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # Auth context
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.jsx
│   └── package.json
│
└── server/                # Express Backend
    ├── src/
    │   ├── config/        # DB, Firebase, Agenda config
    │   ├── controllers/   # Request handlers
    │   ├── middleware/    # Auth & validation
    │   ├── models/        # Mongoose schemas
    │   ├── routes/        # API routes
    │   └── services/      # Business logic
    └── server.js
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Firebase Account

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Google Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Google provider
4. Get Web credentials:
   - Project Settings → General → Your apps
   - Copy Firebase config values
5. Get Service Account:
   - Project Settings → Service Accounts
   - Generate new private key (downloads JSON)
   - Use values in server `.env`

### 2. Backend Setup

```bash
cd server

# Install dependencies (already done)
# npm install

# Create .env file
# Update the following in server/.env:
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task-manager
CORS_ORIGIN=http://localhost:5173

# Firebase Admin SDK (from downloaded JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Start MongoDB (if local)
# mongod

# Run server
npm run dev
```

Server will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd client

# Install dependencies (already done)
# npm install

# .env is already configured with your Firebase credentials

# Run client
npm run dev
```

Client will run on `http://localhost:5173`

### 4. Access the Application

1. Open browser: `http://localhost:5173`
2. Click "Sign in with Google"
3. First user becomes a Member (default role)
4. To make yourself Admin:
   ```bash
   # Connect to MongoDB
   mongosh
   use task-manager
   db.users.updateOne({email: "your@email.com"}, {$set: {role: "Admin"}})
   ```

## Usage

### Task Management

**Follow Ups Page:**
- Create new tasks and assign to others
- Edit/delete tasks you created
- Track status of tasks you assigned

**My Tasks Page:**
- View tasks assigned to you
- Update task status
- Filter by status (All, Pending, In Progress, Completed)

**Recurring Tasks:**
- Create tasks that auto-generate on schedule
- Frequencies: Daily, Weekly, Monthly
- Automatically skips Sundays
- Only creator can edit/delete recurring tasks

### Permissions

- **Task Creation**: Anyone can create and assign tasks
- **Task Editing**: Only task creator can edit/delete
- **Status Updates**: Only assigned user can update status
- **Comments**: Only creator and assigned user can comment
- **Recurring Tasks**: Only creator can edit/delete
- **Role Management**: Only Admin can change user roles

### Dashboard

- View statistics (Total, Completed, Due Today, Overdue)
- Calendar view with all tasks
- Overdue tasks alerts
- Color-coded task status

## API Endpoints

### Authentication
- `POST /api/auth/login` - Firebase login/sync user
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/my-tasks` - Get tasks assigned to me
- `GET /api/tasks/follow-ups` - Get tasks I created
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task (creator only)
- `PATCH /api/tasks/:id/status` - Update status (assigned user)
- `DELETE /api/tasks/:id` - Delete task (creator only)

### Recurring Tasks
- `GET /api/recurring-tasks` - Get all recurring tasks
- `POST /api/recurring-tasks` - Create recurring task
- `PUT /api/recurring-tasks/:id` - Update (creator only)
- `DELETE /api/recurring-tasks/:id` - Delete (creator only)
- `PATCH /api/recurring-tasks/:id/toggle` - Activate/deactivate

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/calendar` - Get tasks for date range
- `GET /api/dashboard/overdue` - Get overdue tasks

### Users
- `GET /api/users` - Get all users
- `PATCH /api/users/:id/role` - Update user role (Admin only)

## Recurring Task Logic

Recurring tasks automatically generate new task instances based on frequency:

- **Daily**: Creates task every day (skips Sundays)
- **Weekly**: Creates task every week
- **Monthly**: Creates task every month

**Sunday Skip Logic:**
- Recurring tasks never generate on Sundays
- If due date falls on Sunday, moves to Monday

**Job Scheduler:**
- Runs daily at 1:00 AM
- Uses Agenda.js with MongoDB storage
- Survives server restarts

## Environment Variables

### Client (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Server (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task-manager
CORS_ORIGIN=http://localhost:5173
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email
```

## Scripts

### Client
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Server
```bash
npm run dev      # Start with nodemon
npm start        # Start production server
```

## Database Schema

### Users
- firebaseUid (unique)
- email
- displayName
- photoURL
- role (Admin/Manager/Member)
- isActive

### Tasks
- title
- description
- status (Pending/In Progress/Completed/Cancelled)
- priority (Low/Medium/High/Urgent)
- dueDate
- assignedTo (ref: User)
- createdBy (ref: User)
- recurringTaskId (ref: RecurringTask)

### Recurring Tasks
- title
- description
- frequency (Daily/Weekly/Monthly)
- startDate
- endDate
- assignedTo (ref: User)
- createdBy (ref: User)
- taskTemplate (priority, tags)
- isActive
- lastGeneratedAt
- nextRunAt

### Task Updates
- taskId (ref: Task)
- userId (ref: User)
- type (Comment/StatusChange/Assignment/Update)
- content
- oldValue
- newValue

## Troubleshooting

### Firebase Authentication Issues
- Verify Firebase config in client `.env`
- Check Firebase Console → Authentication is enabled
- Ensure Google provider is activated

### Server Won't Start
- Check MongoDB is running
- Verify `.env` file exists and has correct values
- Check Firebase Admin SDK credentials

### Recurring Tasks Not Generating
- Check Agenda.js logs in server console
- Verify MongoDB connection
- Check recurring task `isActive` status

## Future Enhancements

- [ ] Email notifications for task assignments
- [ ] File attachments
- [ ] Task priority levels
- [ ] Team/Department organization
- [ ] Mobile app
- [ ] Advanced analytics

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
#   D e n z o  
 