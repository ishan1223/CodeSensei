const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['leetcode', 'hackerrank', 'codeforces', 'atcoder'],
    index: true
  },
  url: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Unknown'],
    default: 'Unknown'
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    maxlength: 2000
  },
  cachedHints: {
    category: String,
    summary: String,
    hints: [String],
    generatedAt: {
      type: Date,
      default: Date.now
    },
    llmProvider: {
      type: String,
      enum: ['gemini', 'openai']
    }
  },
  metadata: {
    problemId: String,
    contestId: String,
    problemNumber: String
  },
  stats: {
    viewCount: {
      type: Number,
      default: 0
    },
    hintUsageCount: {
      type: Number,
      default: 0
    },
    debugSessionCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
problemSchema.index({ platform: 1, title: 1 });
problemSchema.index({ url: 1 });
problemSchema.index({ 'cachedHints.generatedAt': -1 });

// Virtual for cache age
problemSchema.virtual('cacheAge').get(function() {
  if (!this.cachedHints?.generatedAt) return null;
  return Date.now() - this.cachedHints.generatedAt.getTime();
});

// Method to check if cache is stale (older than 24 hours)
problemSchema.methods.isCacheStale = function() {
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  return this.cacheAge > CACHE_TTL;
};

// Method to increment view count
problemSchema.methods.incrementViewCount = function() {
  this.stats.viewCount += 1;
  return this.save();
};

// Method to increment hint usage
problemSchema.methods.incrementHintUsage = function() {
  this.stats.hintUsageCount += 1;
  return this.save();
};

// Method to increment debug sessions
problemSchema.methods.incrementDebugSessions = function() {
  this.stats.debugSessionCount += 1;
  return this.save();
};

module.exports = mongoose.model('Problem', problemSchema);
