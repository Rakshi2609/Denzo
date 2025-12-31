import admin from '../config/firebase.js';
import User from '../models/User.js';

export const verifyToken = async (req, res, next) => {
  console.log('🟣 Backend Middleware: Verifying token...');
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    console.log('❌ Backend Middleware: No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    console.log('🟣 Backend Middleware: Verifying Firebase token...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('🟣 Backend Middleware: Token valid, UID:', decodedToken.uid);
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user || !user.isActive) {
      console.log('❌ Backend Middleware: User not found or inactive');
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    console.log('🟣 Backend Middleware: User found, access granted');
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Backend Middleware: Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
