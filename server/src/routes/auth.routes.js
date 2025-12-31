import express from 'express';
import { login, getCurrentUser } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.js';
import admin from '../config/firebase.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { token, email, displayName, photoURL } = req.body;
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: email || decodedToken.email,
        displayName: displayName || decodedToken.name || 'User',
        photoURL: photoURL || decodedToken.picture
      });
    } else {
      if (displayName) user.displayName = displayName;
      if (photoURL) user.photoURL = photoURL;
      await user.save();
    }

    res.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', verifyToken, getCurrentUser);

export default router;
