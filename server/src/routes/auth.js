import express from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';

import User from '../models/User.js';
import { signToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const googleClient = new OAuth2Client();

function sessionResponse(user) {
  return { token: signToken(user._id), user: user.publicProfile() };
}

// ── Email / password ──
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Email and a 6+ char password required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: email.toLowerCase(), passwordHash, provider: 'email' });
    res.json(sessionResponse(user));
  } catch (e) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password || '', user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    res.json(sessionResponse(user));
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── Google ──
// Client sends Google id_token; we verify it against Google, then upsert.
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const providerId = payload.sub;
    const email = payload.email?.toLowerCase();

    let user = await User.findOne({ provider: 'google', providerId })
      || (email && await User.findOne({ email }));
    if (!user) {
      user = await User.create({ email, provider: 'google', providerId, name: payload.name });
    } else if (!user.providerId) {
      user.provider = 'google'; user.providerId = providerId; await user.save();
    }
    res.json(sessionResponse(user));
  } catch (e) {
    res.status(401).json({ error: 'Google verification failed' });
  }
});

// ── Current user ──
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.publicProfile() });
});

export default router;
