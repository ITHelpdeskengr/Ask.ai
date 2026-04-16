const mongoose = require('mongoose');

const CalendarEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  location: { type: String, default: '' },
  attendees: [{ name: String, email: String }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userEmail: { type: String, required: true },
  sessionId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CalendarEvent', CalendarEventSchema);
