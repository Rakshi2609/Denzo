# AI Agent Instructions - TaskTapper Task Manager

## Architecture Overview

This is a **MERN stack** task management app with Firebase auth, split into two independent services:
- **Frontend** (`client/`): React 19 + Vite + Tailwind, runs on port 5173
- **Backend** (`server/`): Express + MongoDB + Agenda.js scheduler, runs on port 5000

**Authentication Flow**: Firebase handles Google sign-in on frontend → sends token to backend → backend verifies with Firebase Admin SDK → syncs user to MongoDB. All API calls include Firebase token in `Authorization: Bearer <token>` header.

**Role-Based Access**: Three roles (Admin, Manager, Member) defined in `User.js`. Middleware chain: `verifyToken` → `requireRole()` → `taskPermissions` for granular access control.

## Key Architectural Patterns

### 1. Authentication is Two-Phase
Frontend uses Firebase Client SDK (`client/src/services/firebase.js`), backend uses Firebase Admin SDK (`server/src/config/firebase.js`). The `AuthContext.jsx` auto-syncs Firebase user with MongoDB via `/api/auth/login` on every auth state change.

### 2. Recurring Tasks via Agenda.js
`agendaJobs.js` runs every 10 minutes to generate task instances from `RecurringTask` templates. **Critical**: Always skips Sundays, creates tasks for tomorrow/next occurrence. See `calculateNextRun()` function for date logic.

### 3. Permission Model
Tasks are editable only by creator (`createdBy`) or assignee (`assignedTo`). See `server/src/middleware/taskPermissions.js` for the complete rules. Comments follow the same pattern.

### 4. API Interceptors Handle Auth
`client/src/services/api.js` uses axios interceptors to auto-add Firebase tokens and auto-logout on 401. Never manually add auth headers in components.

## Development Workflow

**Start Development**:
```bash
# Terminal 1 - Backend
cd server && npm run dev  # Uses nodemon

# Terminal 2 - Frontend  
cd client && npm run dev  # Vite dev server
```

**Required Environment Setup**:
- Backend needs Firebase Admin SDK credentials in `server/.env` (project ID, private key, client email)
- Frontend needs Firebase web config in `client/src/services/firebase.js`
- MongoDB must be running (local or Atlas URI in `MONGODB_URI`)

**No Tests Exist**: Project has placeholder test scripts, no actual test files.

## Project-Specific Conventions

### API Routes Structure
All routes in `server/src/routes/` follow pattern: `router.METHOD('/path', verifyToken, requireRole('Admin'), controller.handler)`. Route files are imported into `index.js` and mounted under `/api`.

### React Component Patterns
- Pages in `src/pages/` are full screens (Login, Dashboard, MyTasks, etc.)
- Shared components in `src/components/` (Card.jsx, Layout.jsx)
- `ProtectedRoute.jsx` wraps authenticated pages, checks `useAuth()` context
- All API calls use centralized `api` instance from `services/api.js`

### Mongoose Models
All in `server/src/models/`, use timestamps: `{ timestamps: true }`. Key indexes on `Task.js` for performance: compound indexes on `assignedTo + status + dueDate`.

### Status Values
Tasks: `Pending | In Progress | Completed | Cancelled`  
Priority: `Low | Medium | High | Urgent`  
Roles: `Admin | Manager | Member`

### Date Handling
Frontend uses `moment` and `date-fns`, backend uses native Date. **Always set time to midnight** when comparing dates for recurring tasks (`today.setHours(0, 0, 0, 0)`).

## Critical Files for Understanding

- [server/src/middleware/auth.js](server/src/middleware/auth.js): Firebase token verification + role checking
- [server/src/services/agendaJobs.js](server/src/services/agendaJobs.js): Recurring task generation logic (skips Sundays)
- [client/src/contexts/AuthContext.jsx](client/src/contexts/AuthContext.jsx): Auth state management + MongoDB sync
- [client/src/services/api.js](client/src/services/api.js): Centralized axios instance with interceptors
- [server/src/models/Task.js](server/src/models/Task.js): Core task schema with indexes

## Common Gotchas

1. **Firebase Token Expiry**: Tokens refresh automatically via `getIdToken(true)` in api.js interceptor
2. **Sunday Skip Logic**: When modifying recurring tasks, ALWAYS check `agendaJobs.js` for Sunday handling
3. **Permission Checks**: Never bypass `taskPermissions.js` middleware - it enforces creator/assignee rules
4. **Environment Variables**: Backend uses dotenv, frontend uses Vite env vars (prefix with `VITE_`)
5. **CORS**: Backend `CORS_ORIGIN` must match frontend URL (default: http://localhost:5173)
