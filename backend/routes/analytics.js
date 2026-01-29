const express = require('express');
const Story = require('../models/Story');
const Chapter = require('../models/Chapter');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics for current user
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's stories count and stats
    const stories = await Story.find({ author: userId });
    const publishedStories = stories.filter(story => story.status === 'published');
    
    // Calculate total stats
    const totalViews = stories.reduce((sum, story) => sum + story.stats.totalViews, 0);
    const totalLikes = stories.reduce((sum, story) => sum + story.stats.totalLikes, 0);
    const totalComments = stories.reduce((sum, story) => sum + story.stats.totalComments, 0);
    const totalShares = stories.reduce((sum, story) => sum + story.stats.totalShares, 0);

    // Get chapters count
    const totalChapters = await Chapter.countDocuments({ author: userId });
    const publishedChapters = await Chapter.countDocuments({ author: userId, status: 'published' });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStories = await Story.find({
      author: userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).countDocuments();

    const recentChapters = await Chapter.find({
      author: userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).countDocuments();

    // Get top performing stories
    const topStories = await Story.find({ author: userId, status: 'published' })
      .select('title stats createdAt')
      .sort({ 'stats.totalViews': -1 })
      .limit(5);

    res.json({
      overview: {
        totalStories: stories.length,
        publishedStories: publishedStories.length,
        totalChapters,
        publishedChapters,
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        recentActivity: {
          storiesThisMonth: recentStories,
          chaptersThisMonth: recentChapters
        }
      },
      topPerformingStories: topStories
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error.message);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// @route   GET /api/analytics/story/:id
// @desc    Get detailed analytics for a specific story
// @access  Private (Owner only)
router.get('/story/:id', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get chapters analytics
    const chapters = await Chapter.find({ story: story._id })
      .select('title chapterNumber stats publishedAt')
      .sort({ chapterNumber: 1 });

    // Calculate views over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get daily views (this is simplified - in a real app you'd store daily view counts)
    const viewsOverTime = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      viewsOverTime.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 50) // Placeholder - implement actual tracking
      });
    }

    // Get genre performance comparison
    const genreStats = await Story.aggregate([
      { $match: { genre: story.genre, status: 'published' } },
      { 
        $group: { 
          _id: null, 
          avgViews: { $avg: '$stats.totalViews' },
          avgLikes: { $avg: '$stats.totalLikes' },
          avgRating: { $avg: '$stats.averageRating' }
        } 
      }
    ]);

    res.json({
      story: {
        id: story._id,
        title: story.title,
        genre: story.genre,
        status: story.status,
        publishedAt: story.publishedAt,
        stats: story.stats
      },
      chapters: chapters.map(chapter => ({
        id: chapter._id,
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
        stats: chapter.stats,
        publishedAt: chapter.publishedAt
      })),
      viewsOverTime,
      genreComparison: genreStats[0] || {
        avgViews: 0,
        avgLikes: 0,
        avgRating: 0
      },
      performance: {
        viewsVsGenreAvg: story.stats.totalViews - (genreStats[0]?.avgViews || 0),
        likesVsGenreAvg: story.stats.totalLikes - (genreStats[0]?.avgLikes || 0),
        ratingVsGenreAvg: story.stats.averageRating - (genreStats[0]?.avgRating || 0)
      }
    });

  } catch (error) {
    console.error('Get story analytics error:', error.message);
    res.status(500).json({ message: 'Server error fetching story analytics' });
  }
});

// @route   GET /api/analytics/chapter/:id
// @desc    Get detailed analytics for a specific chapter
// @access  Private (Owner only)
router.get('/chapter/:id', protect, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
      .populate('story', 'title author');
    
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    if (chapter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get comments with user details
    await chapter.populate('comments.user', 'username profile.firstName profile.lastName profile.avatar');

    // Calculate engagement rate
    const engagementRate = chapter.stats.views > 0 
      ? ((chapter.stats.likes + chapter.stats.comments) / chapter.stats.views * 100).toFixed(2)
      : 0;

    // Compare with other chapters in the same story
    const otherChapters = await Chapter.find({
      story: chapter.story._id,
      _id: { $ne: chapter._id },
      status: 'published'
    }).select('stats');

    const avgViews = otherChapters.length > 0 
      ? otherChapters.reduce((sum, ch) => sum + ch.stats.views, 0) / otherChapters.length 
      : 0;

    const avgLikes = otherChapters.length > 0 
      ? otherChapters.reduce((sum, ch) => sum + ch.stats.likes, 0) / otherChapters.length 
      : 0;

    res.json({
      chapter: {
        id: chapter._id,
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
        publishedAt: chapter.publishedAt,
        stats: chapter.stats,
        metadata: chapter.metadata,
        story: chapter.story
      },
      engagement: {
        rate: engagementRate,
        comments: chapter.comments.slice(-5) // Last 5 comments
      },
      comparison: {
        viewsVsAvg: chapter.stats.views - avgViews,
        likesVsAvg: chapter.stats.likes - avgLikes,
        avgChapterViews: avgViews.toFixed(0),
        avgChapterLikes: avgLikes.toFixed(0)
      }
    });

  } catch (error) {
    console.error('Get chapter analytics error:', error.message);
    res.status(500).json({ message: 'Server error fetching chapter analytics' });
  }
});

// @route   GET /api/analytics/audience
// @desc    Get audience analytics for current user
// @access  Private
router.get('/audience', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get follower growth over time (simplified)
    const user = await User.findById(userId).populate('followers', 'createdAt');
    
    // Group followers by month
    const followerGrowth = {};
    user.followers.forEach(follower => {
      const month = new Date(follower.createdAt).toISOString().slice(0, 7); // YYYY-MM
      followerGrowth[month] = (followerGrowth[month] || 0) + 1;
    });

    // Get stories liked by followers vs non-followers
    const stories = await Story.find({ author: userId, status: 'published' });
    let followerLikes = 0;
    let totalLikes = 0;

    for (const story of stories) {
      totalLikes += story.likes.length;
      for (const like of story.likes) {
        if (user.followers.some(follower => follower._id.toString() === like.user.toString())) {
          followerLikes++;
        }
      }
    }

    // Get most engaging content types
    const genreEngagement = await Story.aggregate([
      { $match: { author: userId, status: 'published' } },
      {
        $group: {
          _id: '$genre',
          totalViews: { $sum: '$stats.totalViews' },
          totalLikes: { $sum: '$stats.totalLikes' },
          avgRating: { $avg: '$stats.averageRating' },
          storyCount: { $sum: 1 }
        }
      },
      { $sort: { totalViews: -1 } }
    ]);

    res.json({
      followers: {
        total: user.stats.followersCount,
        growth: Object.entries(followerGrowth).map(([month, count]) => ({
          month,
          newFollowers: count
        })).slice(-12) // Last 12 months
      },
      engagement: {
        followerLikeRate: totalLikes > 0 ? (followerLikes / totalLikes * 100).toFixed(2) : 0,
        totalLikes,
        followerLikes
      },
      contentPerformance: genreEngagement.map(genre => ({
        genre: genre._id,
        totalViews: genre.totalViews,
        totalLikes: genre.totalLikes,
        averageRating: genre.avgRating ? genre.avgRating.toFixed(1) : 0,
        storyCount: genre.storyCount,
        avgViewsPerStory: (genre.totalViews / genre.storyCount).toFixed(0)
      }))
    });

  } catch (error) {
    console.error('Get audience analytics error:', error.message);
    res.status(500).json({ message: 'Server error fetching audience analytics' });
  }
});

module.exports = router;
