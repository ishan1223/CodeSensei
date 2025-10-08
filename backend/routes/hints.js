const express = require('express');
const { body, validationResult } = require('express-validator');
const Problem = require('../models/Problem');
const Progress = require('../models/Progress');
const llmClient = require('../utils/llmClient');
const { errorHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/hints
 * Generate hints for a coding problem
 */
router.post('/', [
  body('problem').isObject().withMessage('Problem data is required'),
  body('problem.title').notEmpty().withMessage('Problem title is required'),
  body('problem.platform').isIn(['leetcode', 'hackerrank', 'codeforces', 'atcoder']).withMessage('Invalid platform'),
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

    const { problem, userId } = req.body;

    // Check if LLM is configured
    if (!llmClient.isConfigured()) {
      return res.status(503).json({
        error: 'AI service not configured',
        message: 'Please configure API keys for Gemini or OpenAI'
      });
    }

    // Try to find existing problem in database
    let existingProblem = await Problem.findOne({ url: problem.url });
    
    if (existingProblem && existingProblem.cachedHints && !existingProblem.isCacheStale()) {
      // Return cached hints
      console.log('Returning cached hints for:', problem.title);
      
      // Increment view count
      await existingProblem.incrementViewCount();
      
      // Log progress if userId provided
      if (userId) {
        await logProblemView(userId, existingProblem._id, problem.platform, problem.title);
      }

      return res.json({
        success: true,
        data: {
          category: existingProblem.cachedHints.category,
          summary: existingProblem.cachedHints.summary,
          hints: existingProblem.cachedHints.hints,
          cached: true,
          generatedAt: existingProblem.cachedHints.generatedAt
        }
      });
    }

    // Generate new hints using LLM
    console.log('Generating new hints for:', problem.title);
    
    const hintsData = await llmClient.generateHints(problem);
    
    // Save or update problem in database
    if (existingProblem) {
      existingProblem.cachedHints = hintsData;
      await existingProblem.save();
    } else {
      existingProblem = new Problem({
        title: problem.title,
        platform: problem.platform,
        url: problem.url,
        difficulty: problem.difficulty || 'Unknown',
        tags: problem.tags || [],
        description: problem.description || '',
        cachedHints: hintsData
      });
      await existingProblem.save();
    }

    // Increment view count
    await existingProblem.incrementViewCount();

    // Log progress if userId provided
    if (userId) {
      await logProblemView(userId, existingProblem._id, problem.platform, problem.title);
    }

    res.json({
      success: true,
      data: {
        category: hintsData.category,
        summary: hintsData.summary,
        hints: hintsData.hints,
        cached: false,
        generatedAt: hintsData.generatedAt
      }
    });

  } catch (error) {
    console.error('Error in hints endpoint:', error);
    next(error);
  }
});

/**
 * GET /api/hints/stats
 * Get hints usage statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Problem.aggregate([
      {
        $group: {
          _id: null,
          totalProblems: { $sum: 1 },
          totalViews: { $sum: '$stats.viewCount' },
          totalHintUsage: { $sum: '$stats.hintUsageCount' },
          averageViewsPerProblem: { $avg: '$stats.viewCount' }
        }
      }
    ]);

    const platformStats = await Problem.aggregate([
      {
        $group: {
          _id: '$platform',
          problemCount: { $sum: 1 },
          totalViews: { $sum: '$stats.viewCount' },
          totalHintUsage: { $sum: '$stats.hintUsageCount' }
        }
      },
      { $sort: { problemCount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalProblems: 0,
          totalViews: 0,
          totalHintUsage: 0,
          averageViewsPerProblem: 0
        },
        byPlatform: platformStats
      }
    });

  } catch (error) {
    console.error('Error getting hints stats:', error);
    next(error);
  }
});

/**
 * Helper function to log problem view
 */
async function logProblemView(userId, problemId, platform, problemTitle) {
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
    } else {
      // Update existing progress
      progress.sessionData.sessionStart = new Date();
    }

    await progress.save();
  } catch (error) {
    console.error('Error logging problem view:', error);
    // Don't throw error as this is not critical
  }
}

module.exports = router;
