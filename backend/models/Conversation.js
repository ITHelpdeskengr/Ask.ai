const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  attachment: {
    url: { type: String },
    filename: { type: String },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
  },
});

const ConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: 'New Conversation' },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['idle', 'processing'], default: 'idle' },
});

ConversationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (this.messages.length > 0 && this.title === 'New Conversation') {
    const firstUserMsg = this.messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      this.title = firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
    }
  }
  next();
});

module.exports = mongoose.model('Conversation', ConversationSchema);
