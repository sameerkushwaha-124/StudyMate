const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['DSA', 'OOP']
  },
  subtopic: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one progress record per user per content
UserProgressSchema.index({ userId: 1, contentId: 1 }, { unique: true });

// Index for efficient queries
UserProgressSchema.index({ userId: 1, category: 1 });
UserProgressSchema.index({ userId: 1, completed: 1 });

module.exports = mongoose.model('UserProgress', UserProgressSchema);
