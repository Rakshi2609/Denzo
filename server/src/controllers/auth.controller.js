import User from '../models/User.js';

export const login = async (req, res) => {
  try {
    console.log('🟣 Backend Auth: Login request received');
    const { email, displayName, photoURL } = req.body;
    const firebaseUid = req.user?.firebaseUid || req.body.firebaseUid;
    console.log('🟣 Backend Auth: Email:', email, 'UID:', firebaseUid);

    let user = await User.findOne({ firebaseUid });

    if (!user) {
      console.log('🟣 Backend Auth: Creating new user');
      user = await User.create({
        firebaseUid,
        email,
        displayName,
        photoURL
      });
      console.log('🟣 Backend Auth: User created:', user._id);
    } else {
      console.log('🟣 Backend Auth: User exists, updating');
      user.displayName = displayName || user.displayName;
      user.photoURL = photoURL || user.photoURL;
      await user.save();
      console.log('🟣 Backend Auth: User updated');
    }

    console.log('🟣 Backend Auth: Sending response');
    res.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
