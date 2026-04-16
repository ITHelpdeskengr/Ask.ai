const express = require('express');
const router = express.Router();
const CalendarEvent = require('../models/CalendarEvent');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authMiddleware to all routes
router.use(authMiddleware);

// POST /api/meetings/create
router.post('/create', async (req, res) => {
  try {
    const { title, startTime, endTime, attendees = [], description } = req.body;
    if (!title || !startTime) {
      return res.status(400).json({ error: 'title and startTime are required' });
    }

    const end = endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000);
    const meetingId = uuidv4().split('-')[0].toUpperCase();

    const meetingLink = '';

    const event = new CalendarEvent({
      title,
      description: description || '',
      startTime: new Date(startTime),
      endTime: new Date(end),
      attendees,
      isTeamsMeeting: false,
      meetingLink: '',
      userId: req.user.id,
      userEmail: req.user.email,
    });

    await event.save();

    res.status(201).json({
      meeting: event,
      meetingId,
      meetingLink,
      message: `Meeting "${title}" scheduled! 📅`,
    });
  } catch (err) {
    console.error('[MEETINGS]', err.message);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// GET /api/meetings/upcoming
router.get('/upcoming', async (req, res) => {
  try {
    const now = new Date();
    const meetings = await CalendarEvent.find({ 
      userId: req.user.id,
      startTime: { $gte: now } 
    })
      .sort({ startTime: 1 })
      .limit(10);
    res.json({ meetings, count: meetings.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

module.exports = router;
