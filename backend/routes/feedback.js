const express = require('express');
const { body, validationResult } = require('express-validator');
const Problem = require('../models/Problem');
const Progress = require('../models/Progress');
const llmClient = require('../utils/llmClient');
const { errorHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/feedback
 * Generate debug feedback for user code
 */
router.post('/', [
  body('problem').isObject().withMessage('Problem data is required'),
  body('problem.title').notEmpty().withMessage('Problem title is required'),
  body('problem.platform').isIn(['leetcode', 'hackerrank', 'codeforces', 'atcoder']).withMessage('Invalid platform'),
  body('code').isString().isLength({ min: 10, max: 10000 }).withMessage('Code must be between 10 and 10000 characters'),
  body('userId').optional().isString().withMessage('User ID must be a string')
], async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { problem, code, userId } = req.body;

    // Check if LLM is configured
    if (!llmClient.isConfigured()) {
      return res.status(503).json({
        error: 'AI service not configured',
        message: 'Please configure API keys for Gemini or OpenAI'
      });
    }

    // Sanitize code input
    const sanitizedCode = sanitizeCode(code);

    // Generate debug feedback using LLM
    console.log('Generating debug feedback for:', problem.title);
    
    const feedbackData = await llmClient.generateDebugFeedback(problem, sanitizedCode);

    // Find or create problem record
    let problemRecord = await Problem.findOne({ url: problem.url });
    if (!problemRecord) {
      problemRecord = new Problem({
        title: problem.title,
        platform: problem.platform,
        url: problem.url,
        difficulty: problem.difficulty || 'Unknown',
        tags: problem.tags || [],
        description: problem.description || ''
      });
      await problemRecord.save();
    }

    // Increment debug session count
    await problemRecord.incrementDebugSessions();

    // Log debug session if userId provided
    if (userId) {
      await logDebugSession(userId, problemRecord._id, problem.platform, problem.title, sanitizedCode.length);
    }

    res.json({
      success: true,
      data: {
        tips: feedbackData.tips,
        example: feedbackData.example,
        suggestions: feedbackData.suggestions,
        generatedAt: feedbackData.generatedAt,
        codeLength: sanitizedCode.length
      }
    });

  } catch (error) {
    console.error('Error in feedback endpoint:', error);
    next(error);
  }
});

/**
 * GET /api/feedback/stats
 * Get debug feedback statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Problem.aggregate([
      {
        $group: {
          _id: null,
          totalProblems: { $sum: 1 },
          totalDebugSessions: { $sum: '$stats.debugSessionCount' },
          averageDebugSessionsPerProblem: { $avg: '$stats.debugSessionCount' }
        }
      }
    ]);

    const platformStats = await Problem.aggregate([
      {
        $group: {
          _id: '$platform',
          problemCount: { $sum: 1 },
          totalDebugSessions: { $sum: '$stats.debugSessionCount' }
        }
      },
      { $sort: { problemCount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalProblems: 0,
          totalDebugSessions: 0,
          averageDebugSessionsPerProblem: 0
        },
        byPlatform: platformStats
      }
    });

  } catch (error) {
    console.error('Error getting feedback stats:', error);
    next(error);
  }
});

/**
 * POST /api/feedback/rate
 * Rate the helpfulness of debug feedback
 */
router.post('/rate', [
  body('userId').isString().withMessage('User ID is required'),
  body('problemId').isMongoId().withMessage('Valid problem ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isString().isLength({ max: 500 }).withMessage('Feedback must be less than 500 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId, problemId, rating, feedback } = req.body;

    // Find progress record
    const progress = await Progress.findOne({ userId, problemId });
    if (!progress) {
      return res.status(404).json({
        error: 'Progress record not found',
        message: 'No debug session found for this user and problem'
      });
    }

    // Update rating
    progress.learningMetrics.helpfulnessRating = rating;
    if (feedback) {
      progress.learningMetrics.feedback = feedback;
    }

    await progress.save();

    res.json({
      success: true,
      message: 'Rating saved successfully'
    });

  } catch (error) {
    console.error('Error rating feedback:', error);
    next(error);
  }
});

/**
 * Helper function to sanitize code input
 */
function sanitizeCode(code) {
  // Remove potentially dangerous content
  let sanitized = code
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();

  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  return sanitized;
}

/**
 * Helper function to log debug session
 */
async function logDebugSession(userId, problemId, platform, problemTitle, codeLength) {
  try {
    // Find or create progress record
    let progress = await Progress.findOne({ userId, problemId });
    
    if (!progress) {
      progress = new Progress({
        userId,
        problemId,
        platform,
        problemTitle,
        sessionData: {
          sessionStart: new Date()
        }
      });
    }

    // Add debug session
    await progress.addDebugSession(codeLength, true);

  } catch (error) {
    console.error('Error logging debug session:', error);
    // Don't throw error as this is not critical
  }
}

module.exports = router;
