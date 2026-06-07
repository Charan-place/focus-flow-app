import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /sync — return this user's snapshot.
router.get('/', requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    settings: u.settings || {},
    tasks: u.tasks || [],
    stats: u.stats || {},
    updatedAt: u.dataUpdatedAt || 0,
  });
});

// PUT /sync — store the client's snapshot.
// Last-write-wins by updatedAt: ignore stale pushes so a slow device can't
// clobber newer data.
router.put('/', requireAuth, async (req, res) => {
  try {
    const { settings, tasks, stats, updatedAt } = req.body || {};
    const u = req.user;

    if (updatedAt && u.dataUpdatedAt && updatedAt < u.dataUpdatedAt) {
      // Client is older than what we have — return current server copy.
      return res.json({
        settings: u.settings, tasks: u.tasks, stats: u.stats, updatedAt: u.dataUpdatedAt,
      });
    }

    if (settings) u.settings = settings;
    if (Array.isArray(tasks)) u.tasks = tasks;
    if (stats) u.stats = stats;
    u.dataUpdatedAt = updatedAt || Date.now();
    await u.save();

    res.json({ ok: true, updatedAt: u.dataUpdatedAt });
  } catch (e) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;
