const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const authMiddleware = require('../middleware/authMiddleware');
const CalendarEvent = require('../models/CalendarEvent');

/**
 * GET /api/notifications
 * Aggregates status from Gmail and Calendar.
 */
router.get('/', authMiddleware, async (req, res) => {
  const gmailToken = req.headers['x-gmail-token'];
  const results = {
    emails: { count: 0, unread: 0, latest: [] },
    calendar: { count: 0, today: [] },
    timestamp: new Date()
  };

  try {
    // 1. Check Calendar (Local DB)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingEvents = await CalendarEvent.find({
      userId: req.user.id,
      startTime: { $gte: new Date(), $lt: tomorrow }
    }).sort({ startTime: 1 });

    results.calendar.today = upcomingEvents;
    results.calendar.count = upcomingEvents.length;

    // 2. Check Gmail (If token provided)
    if (gmailToken) {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: gmailToken });
      const gmail = google.gmail({ version: 'v1', auth });

      const listRes = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 5,
        q: 'is:unread -category:social -category:promotions'
      });

      if (listRes.data.messages) {
        results.emails.unread = listRes.data.resultSizeEstimate || listRes.data.messages.length;
        
        // Fetch subjects for a "Quick Check"
        for (const msg of listRes.data.messages.slice(0, 3)) {
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject']
          });
          const headers = detail.data.payload.headers;
          results.emails.latest.push({
            from: headers.find(h => h.name === 'From')?.value || 'Unknown',
            subject: headers.find(h => h.name === 'Subject')?.value || '(No Subject)'
          });
        }
      }
    }

    res.json(results);
  } catch (err) {
    console.error('[NOTIFICATIONS ERROR]', err.message);
    // Return what we have so far instead of 500
    res.json(results);
  }
});

module.exports = router;
