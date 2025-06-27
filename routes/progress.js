const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UserProgress = require('../models/UserProgress');
const Content = require('../models/Content');

// @route   GET /api/progress/stats
// @desc    Get user's progress statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all content
    const allContent = await Content.find({});
    const totalContent = allContent.length;
    const dsaContent = allContent.filter(c => c.category === 'DSA').length;
    const oopContent = allContent.filter(c => c.category === 'OOP').length;

    // Get user's progress
    const userProgress = await UserProgress.find({ userId });
    const completedContent = userProgress.filter(p => p.completed).length;
    const completedDSA = userProgress.filter(p => p.completed && p.category === 'DSA').length;
    const completedOOP = userProgress.filter(p => p.completed && p.category === 'OOP').length;

    // Calculate percentages
    const overallProgress = totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;
    const dsaProgress = dsaContent > 0 ? Math.round((completedDSA / dsaContent) * 100) : 0;
    const oopProgress = oopContent > 0 ? Math.round((completedOOP / oopContent) * 100) : 0;

    // Get unique completed subtopics
    const completedSubtopics = [...new Set(userProgress.filter(p => p.completed).map(p => p.subtopic))];
    const completedSubtopicsCount = completedSubtopics.length;

    // Calculate learning streak (consecutive days with activity)
    const recentActivity = await UserProgress.find({ 
      userId,
      lastAccessed: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).sort({ lastAccessed: -1 });

    let streak = 0;
    if (recentActivity.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activityDates = [...new Set(recentActivity.map(a => {
        const date = new Date(a.lastAccessed);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      }))].sort((a, b) => b - a);

      let currentDate = today.getTime();
      for (const activityDate of activityDates) {
        if (activityDate === currentDate || activityDate === currentDate - 24 * 60 * 60 * 1000) {
          streak++;
          currentDate = activityDate - 24 * 60 * 60 * 1000;
        } else {
          break;
        }
      }
    }

    res.json({
      totalContent,
      completedContent,
      overallProgress,
      dsaContent,
      completedDSA,
      dsaProgress,
      oopContent,
      completedOOP,
      oopProgress,
      completedSubtopicsCount,
      learningStreak: streak,
      lastActivity: recentActivity.length > 0 ? recentActivity[0].lastAccessed : null
    });

  } catch (error) {
    console.error('Error fetching progress stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/progress/content/:category
// @desc    Get user's progress for specific category content
// @access  Private
router.get('/content/:category', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const category = req.params.category.toUpperCase();

    if (!['DSA', 'OOP'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Get all content for the category
    const content = await Content.find({ category }).sort({ subtopic: 1, title: 1 });

    // Get user's progress for this category
    const userProgress = await UserProgress.find({ userId, category });
    const progressMap = {};
    userProgress.forEach(p => {
      progressMap[p.contentId.toString()] = p;
    });

    // Combine content with progress data
    const contentWithProgress = content.map(item => ({
      ...item.toObject(),
      progress: progressMap[item._id.toString()] || null,
      completed: progressMap[item._id.toString()]?.completed || false
    }));

    res.json(contentWithProgress);

  } catch (error) {
    console.error('Error fetching content progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/progress/toggle
// @desc    Toggle completion status of a content item
// @access  Private
router.post('/toggle', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentId } = req.body;

    if (!contentId) {
      return res.status(400).json({ message: 'Content ID is required' });
    }

    // Get the content item
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Find existing progress or create new one
    let progress = await UserProgress.findOne({ userId, contentId });

    if (progress) {
      // Toggle completion status
      progress.completed = !progress.completed;
      progress.completedAt = progress.completed ? new Date() : null;
      progress.lastAccessed = new Date();
      await progress.save();
    } else {
      // Create new progress record
      progress = new UserProgress({
        userId,
        contentId,
        category: content.category,
        subtopic: content.subTopic || 'General', // Use correct field name
        completed: true,
        completedAt: new Date(),
        lastAccessed: new Date()
      });
      await progress.save();
    }

    res.json({
      contentId,
      completed: progress.completed,
      completedAt: progress.completedAt
    });

  } catch (error) {
    console.error('Error toggling progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/progress/access
// @desc    Update last accessed time for content (for tracking activity)
// @access  Private
router.post('/access', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentId } = req.body;

    if (!contentId) {
      return res.status(400).json({ message: 'Content ID is required' });
    }

    // Get the content item
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Find existing progress or create new one
    let progress = await UserProgress.findOne({ userId, contentId });

    if (progress) {
      progress.lastAccessed = new Date();
      await progress.save();
    } else {
      // Create new progress record
      progress = new UserProgress({
        userId,
        contentId,
        category: content.category,
        subtopic: content.subTopic || 'General', // Use correct field name
        completed: false,
        lastAccessed: new Date()
      });
      await progress.save();
    }

    res.json({ message: 'Access recorded' });

  } catch (error) {
    console.error('Error recording access:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
