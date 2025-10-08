const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { errorHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/progress/:userId
 * Get user progress and statistics
 */
router.get('/:userId', [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    // Validate userId format
    if (!userId || typeof userId !== 'string' || userId.length < 5) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a valid string'
      });
    }

    // Get or create user
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId });
      await user.save();
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get user statistics
    const userStats = await Progress.getUserStats(userId);

    // Get recent progress
    const recentProgress = await Progress.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('problemId', 'title platform difficulty')
    .sort({ createdAt: -1 })
    .limit(50);

    // Get daily activity
    const dailyActivity = await Progress.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          hintsUsed: { $sum: '$learningMetrics.hintsUsed' },
          debugSessions: { $sum: '$learningMetrics.debugSessions' },
          problemsViewed: { $sum: 1 },
          timeSpent: { $sum: '$sessionData.timeSpent' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get platform breakdown
    const platformBreakdown = await Progress.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$platform',
          problemsViewed: { $sum: 1 },
          hintsUsed: { $sum: '$learningMetrics.hintsUsed' },
          debugSessions: { $sum: '$learningMetrics.debugSessions' },
          averageTimeSpent: { $avg: '$sessionData.timeSpent' }
        }
      },
      { $sort: { problemsViewed: -1 } }
    ]);

    // Calculate streak
    const streak = await calculateStreak(userId);

    res.json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          createdAt: user.createdAt,
          lastActive: user.lastActive,
          preferences: user.preferences,
          stats: user.stats
        },
        period: {
          days: parseInt(days),
          startDate,
          endDate
        },
        overall: userStats,
        recent: recentProgress.map(p => ({
          id: p._id,
          problem: p.problemId,
          platform: p.platform,
          hintsUsed: p.learningMetrics.hintsUsed,
          debugSessions: p.learningMetrics.debugSessions,
          completionStatus: p.learningMetrics.completionStatus,
          createdAt: p.createdAt
        })),
        dailyActivity,
        platformBreakdown,
        streak
      }
    });

  } catch (error) {
    console.error('Error getting user progress:', error);
    next(error);
  }
});

/**
 * POST /api/progress/hint
 * Log hint usage
 */
router.post('/hint', [
  body('userId').isString().withMessage('User ID is required'),
  body('problemId').isMongoId().withMessage('Valid problem ID is required'),
  body('hintIndex').isInt({ min: 0, max: 10 }).withMessage('Hint index must be between 0 and 10')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId, problemId, hintIndex } = req.body;

    // Find or create progress record
    let progress = await Progress.findOne({ userId, problemId });
    
    if (!progress) {
      return res.status(404).json({
        error: 'Progress record not found',
        message: 'Please view the problem first before using hints'
      });
    }

    // Add revealed hint
    await progress.addRevealedHint(hintIndex);

    // Update user stats
    await User.findOneAndUpdate(
      { userId },
      { 
        $inc: { 'stats.totalHintsUsed': 1 },
        $set: { lastActive: new Date() }
      }
    );

    res.json({
      success: true,
      message: 'Hint usage logged successfully'
    });

  } catch (error) {
    console.error('Error logging hint usage:', error);
    next(error);
  }
});

/**
 * POST /api/progress/complete
 * Mark problem as completed
 */
router.post('/complete', [
  body('userId').isString().withMessage('User ID is required'),
  body('problemId').isMongoId().withMessage('Valid problem ID is required'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId, problemId, rating } = req.body;

    // Find progress record
    const progress = await Progress.findOne({ userId, problemId });
    if (!progress) {
      return res.status(404).json({
        error: 'Progress record not found',
        message: 'No progress found for this user and problem'
      });
    }

    // Update completion status
    progress.learningMetrics.completionStatus = 'completed';
    if (rating) {
      progress.learningMetrics.helpfulnessRating = rating;
    }

    // End session
    await progress.endSession();

    // Update user stats
    await User.findOneAndUpdate(
      { userId },
      { 
        $inc: { 'stats.totalProblemsViewed': 1 },
        $set: { lastActive: new Date() }
      }
    );

    res.json({
      success: true,
      message: 'Problem marked as completed'
    });

  } catch (error) {
    console.error('Error marking problem complete:', error);
    next(error);
  }
});

/**
 * GET /api/progress/leaderboard
 * Get platform leaderboard
 */
router.get('/leaderboard/:platform', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { limit = 10 } = req.query;

    if (!['leetcode', 'hackerrank', 'codeforces', 'atcoder'].includes(platform)) {
      return res.status(400).json({
        error: 'Invalid platform',
        message: 'Platform must be one of: leetcode, hackerrank, codeforces, atcoder'
      });
    }

    const leaderboard = await Progress.aggregate([
      { $match: { platform } },
      {
        $group: {
          _id: '$userId',
          totalProblems: { $sum: 1 },
          totalHintsUsed: { $sum: '$learningMetrics.hintsUsed' },
          totalDebugSessions: { $sum: '$learningMetrics.debugSessions' },
          completedProblems: {
            $sum: {
              $cond: [{ $eq: ['$learningMetrics.completionStatus', 'completed'] }, 1, 0]
            }
          },
          averageHelpfulness: { $avg: '$learningMetrics.helpfulnessRating' },
          lastActive: { $max: '$createdAt' }
        }
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ['$completedProblems', 10] },
              { $multiply: ['$totalHintsUsed', -1] },
              { $multiply: ['$totalDebugSessions', -0.5] }
            ]
          }
        }
      },
      { $sort: { score: -1, completedProblems: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: {
        platform,
        leaderboard: leaderboard.map((entry, index) => ({
          rank: index + 1,
          userId: entry._id,
          totalProblems: entry.totalProblems,
          completedProblems: entry.completedProblems,
          totalHintsUsed: entry.totalHintsUsed,
          totalDebugSessions: entry.totalDebugSessions,
          averageHelpfulness: entry.averageHelpfulness || 0,
          score: entry.score,
          lastActive: entry.lastActive
        }))
      }
    });

  } catch (error) {
    console.error('Error getting leaderboard:', error);
    next(error);
  }
});

/**
 * Helper function to calculate user streak
 */
async function calculateStreak(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
      const startOfDay = new Date(currentDate);
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const dayActivity = await Progress.findOne({
        userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      if (dayActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

module.exports = router;
