const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    hintsEnabled: {
      type: Boolean,
      default: true
    },
    debugEnabled: {
      type: Boolean,
      default: true
    },
    preferredLLM: {
      type: String,
      enum: ['gemini', 'openai'],
      default: 'gemini'
    }
  },
  stats: {
    totalHintsUsed: {
      type: Number,
      default: 0
    },
    totalProblemsViewed: {
      type: Number,
      default: 0
    },
    totalDebugSessions: {
      type: Number,
      default: 0
    },
    streakDays: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Update lastActive on save
userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

// Index for efficient queries
userSchema.index({ userId: 1 });
userSchema.index({ lastActive: -1 });

module.exports = mongoose.model('User', userSchema);
