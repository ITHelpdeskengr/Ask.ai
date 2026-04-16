const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  mimeType: {
    type: String
  },
  size: {
    type: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  driveFileId: {
    type: String,
    index: true // Optional indexing if we need fast lookups
  },
  isDriveSync: {
    type: Boolean,
    default: false
  },
  lastModifiedTime: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Knowledge', knowledgeSchema);
