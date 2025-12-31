# 🚀 Quick Start Commands

## Start Everything (2 Terminals Required)

### Terminal 1 - Backend Server
```bash
cd server
npm run dev
```

Expected output:
```
Server is running on port 5000
MongoDB connected successfully
Agenda scheduler started
```

### Terminal 2 - Frontend Client
```bash
cd client
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Open Application

Browser: `http://localhost:5173`

## First Time Setup Checklist

- [ ] MongoDB running locally OR using MongoDB Atlas
- [ ] Updated `server/.env` with Firebase Admin SDK credentials
- [ ] Both `client/.env` and `server/.env` files exist
- [ ] Signed in with Google
- [ ] Made yourself Admin (if needed): 
  ```bash
  mongosh
  use task-manager
  db.users.updateOne({email: "your@gmail.com"}, {$set: {role: "Admin"}})
  ```

## Test Features

1. **Dashboard**: View stats and calendar
2. **Follow Ups**: Create a task and assign to someone
3. **My Tasks**: View tasks assigned to you
4. **Recurring Tasks**: Create a recurring task
5. **Admin Panel** (if Admin): Change user roles

## Stop Servers

Press `Ctrl + C` in each terminal

## Troubleshooting

### Server won't start
- Check MongoDB is running: `mongod` or `net start MongoDB`
- Verify `.env` file exists in server folder
- Check Firebase credentials in `server/.env`

### Client won't start
- Check `.env` file exists in client folder
- Verify all dependencies installed: `npm install`

### Can't login
- Check Firebase config in `client/.env`
- Verify Google auth is enabled in Firebase Console
- Clear browser cache and try again

### No data showing
- Check browser console (F12) for errors
- Check server terminal for errors
- Verify MongoDB connection

## Development Tips

- Server auto-restarts on code changes (nodemon)
- Client hot-reloads on code changes (Vite HMR)
- Check browser console for frontend errors
- Check terminal for backend errors
- Use MongoDB Compass to view database

## Production Build

```bash
# Build client
cd client
npm run build

# Run server in production
cd ../server
NODE_ENV=production npm start
```

## Need More Help?

See `SETUP.md` for detailed setup instructions
See `README.md` for full documentation
