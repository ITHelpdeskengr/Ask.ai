const cron = require('node-cron');
const CalendarEvent = require('../models/CalendarEvent');

const backgroundService = {
  start() {
    console.log('⚙️  Background service started (24/7 mode)');

    // Every minute: check for upcoming meetings in next 15 min
    cron.schedule('* * * * *', async () => {
      try {
        const now = new Date();
        const in15 = new Date(now.getTime() + 15 * 60 * 1000);
        const upcoming = await CalendarEvent.find({
          startTime: { $gte: now, $lte: in15 },
          reminded: { $ne: true },
        });

        for (const event of upcoming) {
          const minutesLeft = Math.round((event.startTime - now) / 60000);
          console.log(`🔔 Reminder: "${event.title}" starts in ${minutesLeft} minutes`);
          // Here you could trigger push notifications or Teams messages
        }
      } catch (err) {
        // DB might not be connected yet — silent fail
      }
    });

    // Every hour: log system status
    cron.schedule('0 * * * *', () => {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      console.log(`💚 [${new Date().toISOString()}] System healthy | Uptime: ${hours}h ${minutes}m`);
    });

    // Every day at midnight: cleanup old events (older than 30 days)
    cron.schedule('0 0 * * *', async () => {
      try {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await CalendarEvent.deleteMany({ endTime: { $lt: cutoff } });
        if (result.deletedCount > 0) {
          console.log(`🧹 Cleaned up ${result.deletedCount} old calendar events`);
        }
      } catch (err) {
        // Silently ignore
      }
    });

    // Keep-alive ping for Render free tier (prevents spin-down)
    if (process.env.RENDER_URL && !process.env.RENDER_URL.includes('your-app')) {
      cron.schedule('*/14 * * * *', async () => {
        try {
          const axios = require('axios');
          await axios.get(`${process.env.RENDER_URL}/api/health`);
          console.log('🏓 Keep-alive ping sent');
        } catch (err) {
          // Normal if server is restarting
        }
      });
    }
  },
};

module.exports = backgroundService;
