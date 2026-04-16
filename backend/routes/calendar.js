const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const CalendarEvent = require('../models/CalendarEvent');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const googleCalendarService = require('../services/googleCalendarService');

// GET /api/calendar/public/:token - PUBLIC ROUTE (No Auth)
router.get('/public/:token', async (req, res) => {
  try {
    const user = await User.findOne({ calendarShareToken: req.params.token });
    if (!user) return res.status(404).json({ error: 'Public calendar not found or invalid link' });

    // Fetch upcoming/active events for this user
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const events = await CalendarEvent.find({
      userId: user._id,
      endTime: { $gte: today } // Only show events that haven't ended yet compared to today
    })
    .sort({ startTime: 1 })
    .select('title description startTime endTime location -_id')
    .lean();

    res.json({
      userName: user.name,
      events: events
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch public calendar' });
  }
});

// Apply authMiddleware to all routes below
router.use(authMiddleware);

// POST /api/calendar/share - Generate or get shareable token
router.post('/share', async (req, res) => {
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.calendarShareToken) {
      user.calendarShareToken = crypto.randomBytes(16).toString('hex');
      await user.save();
    }

    res.json({
      token: user.calendarShareToken,
      url: `/calendar/${user.calendarShareToken}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// GET /api/calendar/events
router.get('/events', async (req, res) => {
  const googleToken = req.headers['x-google-token'] || req.headers['x-gmail-token'];
  const userEmail = req.user.email;

  try {
    const { from, to, range } = req.query;
    
    // Attempt Google Calendar Sync if authorized or delegated
    if (googleToken || (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && userEmail)) {
      try {
        const calendar = googleCalendarService.getClient(googleToken, userEmail);
        
        let timeMin = new Date().toISOString();
        let timeMax = undefined;

        if (range === 'today') {
          const start = new Date(); start.setHours(0,0,0,0);
          timeMin = start.toISOString();
          const end = new Date(start); end.setDate(end.getDate() + 1);
          timeMax = end.toISOString();
        } else if (range === 'week') {
          const start = new Date(); start.setHours(0,0,0,0);
          timeMin = start.toISOString();
          const end = new Date(start); end.setDate(end.getDate() + 7);
          timeMax = end.toISOString();
        } else {
          if (from) timeMin = new Date(from).toISOString();
          if (to) timeMax = new Date(to).toISOString();
        }

        const eventsRes = await calendar.events.list({
          calendarId: 'primary',
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: 'startTime',
        });

        const googleEvents = (eventsRes.data.items || []).map(e => ({
          id: e.id,
          title: e.summary,
          description: e.description,
          startTime: e.start.dateTime || e.start.date,
          endTime: e.end.dateTime || e.end.date,
          location: e.location,
          htmlLink: e.htmlLink,
          isGoogleEvent: true
        }));

        return res.json({ events: googleEvents, count: googleEvents.length, source: 'google' });
      } catch (gErr) {
        console.error('[GOOGLE CALENDAR FETCH ERROR]', gErr.message);
        // Fallback to local if Google fails
      }
    }

    // Fallback: Local MongoDB Events
    const query = { userId: req.user.id };
    if (range === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      query.startTime = { $gte: start, $lt: end };
    } else if (range === 'week') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(end.getDate() + 7);
      query.startTime = { $gte: start, $lt: end };
    } else {
      if (from) query.startTime = { $gte: new Date(from) };
      if (to) query.endTime = { ...query.endTime, $lte: new Date(to) };
    }

    const events = await CalendarEvent.find(query).sort({ startTime: 1 }).limit(50);
    res.json({ events, count: events.length, source: 'local' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/calendar/today
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await CalendarEvent.find({
      userId: req.user.id,
      startTime: { $gte: today, $lt: tomorrow },
    }).sort({ startTime: 1 });

    res.json({ events, date: today.toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today\'s events' });
  }
});

// POST /api/calendar/events
router.post('/events', async (req, res) => {
  const googleToken = req.headers['x-google-token'] || req.headers['x-gmail-token'];
  const userEmail = req.user.email;

  try {
    const { title, description, startTime, endTime, location, attendees } = req.body;
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'title, startTime, endTime are required' });
    }

    // Attempt Google Calendar Creation
    if (googleToken || (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && userEmail)) {
      try {
        const calendar = googleCalendarService.getClient(googleToken, userEmail);
        const gEvent = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: title,
            description,
            location,
            start: { dateTime: new Date(startTime).toISOString() },
            end: { dateTime: new Date(endTime).toISOString() },
            attendees: (attendees || []).map(a => ({ email: a }))
          }
        });
        return res.status(201).json({ event: gEvent.data, message: `Event "${title}" created in Google Calendar!` });
      } catch (gErr) {
        console.error('[GOOGLE CALENDAR CREATE ERROR]', gErr.message);
        // Fallback to local if Google fails
      }
    }

    const event = new CalendarEvent({ 
      title, description, startTime, endTime, location, attendees,
      userId: req.user.id,
      userEmail: req.user.email
    });
    await event.save();
    res.status(201).json({ event, message: `Event "${title}" saved to local calendar.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// DELETE /api/calendar/events/:id
router.delete('/events/:id', async (req, res) => {
  const { id } = req.params;
  const googleToken = req.headers['x-google-token'] || req.headers['x-gmail-token'];
  const userEmail = req.user.email;

  try {
    let deleted = false;

    // 1. Attempt Google Calendar deletion if we have a token and the ID looks like a Google ID (typical non-ObjectId)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isObjectId && (googleToken || (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && userEmail))) {
      try {
        const calendar = googleCalendarService.getClient(googleToken, userEmail);
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: id
        });
        deleted = true;
      } catch (gErr) {
        console.error('[GOOGLE CALENDAR DELETE ERROR]', gErr.response?.data || gErr.message);
        // If not found in Google, maybe it was a cached ID or similar? Let it fall through.
      }
    }

    // 2. Always attempt local MongoDB cleanup
    const localEvent = await CalendarEvent.findOneAndDelete({ 
      $or: [{ _id: isObjectId ? id : null }, { googleId: id }], 
      userId: req.user.id 
    });
    
    if (localEvent) deleted = true;

    if (!deleted && !isObjectId) {
      // If it wasn't found in Mongo but we attempted Google, assume success if no error was thrown earlier
      // or indicate specific failure.
      return res.json({ success: true, message: 'Delete request processed.' });
    }

    if (!deleted) return res.status(404).json({ error: 'Event not found or unauthorized' });
    
    res.json({ success: true, message: 'Event successfully deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

/**
 * GET /api/calendar/admin/list/:email
 * Fetches the upcoming calendar events for a specific user.
 * Admin only, uses Domain-Wide Delegation.
 */
const adminMiddleware = require('../middleware/adminMiddleware');
router.get('/admin/list/:email', authMiddleware, adminMiddleware, async (req, res) => {
  const { email: targetUserEmail } = req.params;

  try {
    const calendar = googleCalendarService.getDelegatedClient(targetUserEmail);

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const eventsRes = await calendar.events.list({
      calendarId: 'primary',
      timeMin: start.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const googleEvents = (eventsRes.data.items || []).map(e => ({
      id: e.id,
      title: e.summary,
      description: e.description,
      startTime: e.start.dateTime || e.start.date,
      endTime: e.end.dateTime || e.end.date,
      location: e.location,
      htmlLink: e.htmlLink,
    }));

    res.json({
      success: true,
      events: googleEvents,
      targetUser: targetUserEmail
    });

  } catch (err) {
    console.error('[ADMIN CALENDAR ERROR]', err.response?.data || err.message);
    res.status(500).json({ error: `Failed to fetch calendar for ${targetUserEmail}: ` + (err.response?.data?.error_description || err.message) });
  }
});

module.exports = router;
