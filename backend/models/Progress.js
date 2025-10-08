const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    index: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['leetcode', 'hackerrank', 'codeforces', 'atcoder']
  },
  problemTitle: {
    type: String,
    required: true
  },
  sessionData: {
    hintsRevealed: [{
      hintIndex: Number,
      revealedAt: {
        type: Date,
        default: Date.now
      }
    }],
    debugSessions: [{
      codeLength: Number,
      feedbackReceived: Boolean,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    timeSpent: {
      type: Number, // in milliseconds
      default: 0
    },
    sessionStart: {
      type: Date,
      default: Date.now
    },
    sessionEnd: Date
  },
  learningMetrics: {
    hintsUsed: {
      type: Number,
      default: 0
    },
    debugSessions: {
      type: Number,
      default: 0
    },
    completionStatus: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress'
    },
    difficultyRating: {
      type: Number,
      min: 1,
      max: 5
    },
    helpfulnessRating: {
      type: Number,
      min: 1,
      max: 5
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
progressSchema.index({ userId: 1, problemId: 1 });
progressSchema.index({ userId: 1, createdAt: -1 });
progressSchema.index({ platform: 1, createdAt: -1 });

// Method to add a revealed hint
progressSchema.methods.addRevealedHint = function(hintIndex) {
  this.sessionData.hintsRevealed.push({
    hintIndex: hintIndex,
    revealedAt: new Date()
  });
  this.learningMetrics.hintsUsed += 1;
  return this.save();
};

// Method to add a debug session
progressSchema.methods.addDebugSession = function(codeLength, feedbackReceived = true) {
  this.sessionData.debugSessions.push({
    codeLength: codeLength,
    feedbackReceived: feedbackReceived,
    timestamp: new Date()
  });
  this.learningMetrics.debugSessions += 1;
  return this.save();
};

// Method to update time spent
progressSchema.methods.updateTimeSpent = function() {
  if (this.sessionData.sessionStart) {
    this.sessionData.timeSpent = Date.now() - this.sessionData.sessionStart.getTime();
  }
  return this.save();
};

// Method to end session
progressSchema.methods.endSession = function() {
  this.sessionData.sessionEnd = new Date();
  this.updateTimeSpent();
  return this.save();
};

// Static method to get user statistics
progressSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: null,
        totalProblems: { $sum: 1 },
        totalHintsUsed: { $sum: '$learningMetrics.hintsUsed' },
        totalDebugSessions: { $sum: '$learningMetrics.debugSessions' },
        totalTimeSpent: { $sum: '$sessionData.timeSpent' },
        completedProblems: {
          $sum: {
            $cond: [{ $eq: ['$learningMetrics.completionStatus', 'completed'] }, 1, 0]
          }
        },
        averageHelpfulness: { $avg: '$learningMetrics.helpfulnessRating' }
      }
    }
  ]);
  
  return stats[0] || {
    totalProblems: 0,
    totalHintsUsed: 0,
    totalDebugSessions: 0,
    totalTimeSpent: 0,
    completedProblems: 0,
    averageHelpfulness: 0
  };
};

// Static method to get platform statistics
progressSchema.statics.getPlatformStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$platform',
        totalSessions: { $sum: 1 },
        totalHintsUsed: { $sum: '$learningMetrics.hintsUsed' },
        totalDebugSessions: { $sum: '$learningMetrics.debugSessions' },
        averageTimeSpent: { $avg: '$sessionData.timeSpent' }
      }
    },
    { $sort: { totalSessions: -1 } }
  ]);
};

module.exports = mongoose.model('Progress', progressSchema);
