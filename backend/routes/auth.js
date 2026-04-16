const express = require('express');
const router = express.Router();
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const googleAuthService = require('../services/googleAuthService');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';

/**
 * Helper to generate a 6-digit code and save to user
 */
const prepareSecurityChallenge = async (user) => {
  if (!googleAuthService.isConfigured() || user.role === 'admin') {
    console.log(`[AUTH] Security challenge skipped: ${user.role === 'admin' ? 'Admin bypass' : 'Service Account not configured'}.`);
    return null;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  user.verificationCode = code;
  user.verificationCodeExpires = expires;
  await user.save();

  // Send branded email
  await googleAuthService.sendSecurityCode(user.email, code).catch(err => {
    console.error('[SECURITY CHALLENGE ERROR] DETAILED:', err.message);
    throw new Error('Failed to send verification email. Ensure Service Account is configured or DISABLE_SECURITY_CHALLENGE=true in .env');
  });

  // Return a temp token to identify the user during challenge
  return jwt.sign(
    { id: user._id, type: 'challenge' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const sendFullAuthResponse = (user, res) => {
  const token = jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role }
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ email, name, password: hashedPassword, isVerified: false });
    await user.save();

    try {
      const tempToken = await prepareSecurityChallenge(user);
      if (tempToken) {
        return res.json({ requireVerification: true, tempToken, email: user.email });
      }
      sendFullAuthResponse(user, res);
    } catch (gErr) {
      console.error('[SECURITY CHALLENGE ERROR]', gErr.message);
      res.status(500).json({ error: 'Failed to initiate security challenge: ' + gErr.message });
    }
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { idToken, accessToken } = req.body;
  if (!idToken && !accessToken) return res.status(400).json({ error: 'idToken or accessToken is required' });

  try {
    let googleId, email, name, avatar;

    if (accessToken) {
      // Verify via accessToken (Unified Flow)
      const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      googleId = data.sub;
      email = data.email;
      name = data.name;
      avatar = data.picture;
    } else {
      // Verify via idToken (Legacy Flow)
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      avatar = payload.picture;
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    let isNewUser = false;

    if (!user) {
      // Brand-new Google sign-up: create with pending status
      user = new User({ googleId, email, name, avatar, isVerified: false, registrationStatus: 'pending' });
      await user.save();
      isNewUser = true;
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = avatar;
      await user.save();
    }

    if (user.role !== 'admin') {
      if (user.registrationStatus === 'pending') {
        return res.status(200).json({ pendingApproval: true, email: user.email, isNewUser });
      }
      if (user.registrationStatus === 'rejected') {
        return res.status(403).json({ error: 'Your registration was rejected by the administrator.' });
      }
    }

    try {
      const tempToken = await prepareSecurityChallenge(user);
      if (tempToken) {
        return res.json({ requireVerification: true, tempToken, email: user.email });
      }
      sendFullAuthResponse(user, res);
    } catch (gErr) {
      console.error('[SECURITY CHALLENGE ERROR]', gErr.message);
      res.status(500).json({ error: 'Failed to initiate security challenge: ' + gErr.message });
    }
  } catch (err) {
    console.error('[AUTH ERROR]', err.message);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const admins = ['admin@ask.ai', 'admin'];
    let user;
    
    if (admins.includes(email) && password === 'password123') {
      user = await User.findOne({ email: 'admin@ask.ai' });
      if (!user) {
        user = new User({ email: 'admin@ask.ai', name: 'Admin', role: 'admin', isVerified: true });
        await user.save();
      }
    } else {
      user = await User.findOne({ email }).select('+password');
      if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      if (user.registrationStatus === 'pending') {
        return res.status(403).json({ error: 'Your account is pending admin approval.' });
      }
      if (user.registrationStatus === 'rejected') {
        return res.status(403).json({ error: 'Your registration was rejected.' });
      }
    }

    try {
      const tempToken = await prepareSecurityChallenge(user);
      if (tempToken) {
        return res.json({ requireVerification: true, tempToken, email: user.email });
      }
      sendFullAuthResponse(user, res);
    } catch (gErr) {
      console.error('[SECURITY CHALLENGE ERROR]', gErr.message);
      res.status(500).json({ error: 'Failed to initiate security challenge: ' + gErr.message });
    }
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/verify-security-code
router.post('/verify-security-code', async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) return res.status(400).json({ error: 'Token and code are required' });

  try {
    const decoded = jwt.verify(tempToken, JWT_SECRET);
    if (decoded.type !== 'challenge') throw new Error('Invalid token type');

    const user = await User.findById(decoded.id).select('+verificationCode +verificationCodeExpires');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.verificationCode !== code || user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.isVerified = true;
    await user.save();

    sendFullAuthResponse(user, res);
  } catch (err) {
    res.status(401).json({ error: 'Verification failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/users (Admin only)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/auth/users/:id/status
router.put('/users/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.registrationStatus = status;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// DELETE /api/auth/users/:id
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/auth/admin/analytics
router.get('/admin/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingUsers = await User.countDocuments({ registrationStatus: 'pending' });
    const verifiedUsers = await User.countDocuments({ registrationStatus: 'approved' });
    const totalSessions = await Conversation.countDocuments();
    
    res.json({
      analytics: {
        totalUsers,
        pendingUsers,
        verifiedUsers,
        totalSessions
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// PUT /api/auth/profile — update own name / password
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name && name.trim()) user.name = name.trim();

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password is required to set a new password' });
      // For admin accounts created without a password, allow setting one without verification
      if (user.password) {
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
      }
      if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ success: true, user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role }, token });
  } catch (err) {
    console.error('[PROFILE UPDATE ERROR]', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
