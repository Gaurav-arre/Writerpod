const express = require('express');
const { body, validationResult } = require('express-validator');
const Story = require('../models/Story');
const Chapter = require('../models/Chapter');
const User = require('../models/User');
const { protect, checkOwnership, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/stories
// @desc    Get all public stories with filters and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { status: 'published', visibility: 'public' };

    // Genre filter
    if (req.query.genre && req.query.genre !== 'all') {
      filter.genre = req.query.genre;
    }

    // Search functionality
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Author filter
    if (req.query.author) {
      filter.author = req.query.author;
    }

    // Sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    switch (req.query.sort) {
      case 'popular':
        sortOptions = { 'stats.totalViews': -1, 'stats.totalLikes': -1 };
        break;
      case 'rating':
        sortOptions = { 'stats.averageRating': -1, 'stats.totalRatings': -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'updated':
        sortOptions = { updatedAt: -1 };
        break;
    }

    const stories = await Story.find(filter)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .populate({
        path: 'chapters',
        match: { status: 'published' },
        select: 'title chapterNumber publishedAt',
        options: { sort: { chapterNumber: 1 } }
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Story.countDocuments(filter);

    // Add user interaction data if authenticated
    if (req.user) {
      for (let story of stories) {
        story.isLiked = story.likes.some(like => like.user.toString() === req.user._id.toString());
        story.isBookmarked = story.bookmarks.some(bookmark => bookmark.user.toString() === req.user._id.toString());
      }
    }

    res.json({
      stories,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get stories error:', error.message);
    res.status(500).json({ message: 'Server error fetching stories' });
  }
});

// @route   GET /api/stories/:id
// @desc    Get single story by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const baseStory = await Story.findById(req.params.id);
    if (!baseStory) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user is the owner to determine which chapters to populate
    // If user is owner, populate all chapters; otherwise, only published chapters
    const isOwner = req.user && baseStory.author.toString() === req.user._id.toString();
    
    let story;
    if (isOwner) {
      // Populate all chapters for owner
      story = await Story.findById(req.params.id)
        .populate('author', 'username profile.firstName profile.lastName profile.avatar stats.followersCount')
        .populate({
          path: 'chapters',
          select: 'title chapterNumber status metadata stats',
          options: { sort: { chapterNumber: 1 } }
        });
    } else {
      // Populate only published chapters for others
      story = await Story.findById(req.params.id)
        .populate('author', 'username profile.firstName profile.lastName profile.avatar stats.followersCount')
        .populate({
          path: 'chapters',
          match: { status: 'published' },
          select: 'title chapterNumber publishedAt metadata stats',
          options: { sort: { chapterNumber: 1 } }
        });
    }

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user can view this story
    if (story.visibility === 'private' && (!req.user || story.author._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'This story is private' });
    }

    if (story.visibility === 'followers-only' && req.user) {
      const author = await User.findById(story.author._id);
      if (!author.followers.includes(req.user._id) && story.author._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'This story is only available to followers' });
      }
    }

    // Increment view count (but not for the author)
    if (!req.user || req.user._id.toString() !== story.author._id.toString()) {
      await Story.findByIdAndUpdate(story._id, { $inc: { 'stats.totalViews': 1 } });
    }

    // Add user interaction data
    let userInteraction = {};
    if (req.user) {
      userInteraction.isLiked = story.likes.some(like => like.user.toString() === req.user._id.toString());
      userInteraction.isBookmarked = story.bookmarks.some(bookmark => bookmark.user.toString() === req.user._id.toString());
      userInteraction.userRating = story.ratings.find(rating => rating.user.toString() === req.user._id.toString())?.rating || 0;
    }

    res.json({
      story: {
        ...story.toObject(),
        userInteraction
      }
    });

  } catch (error) {
    console.error('Get story error:', error.message);
    res.status(500).json({ message: 'Server error fetching story' });
  }
});

// @route   POST /api/stories
// @desc    Create new story
// @access  Private
router.post('/', protect, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 characters)'),
  body('description').trim().isLength({ min: 1, max: 1000 }).withMessage('Description is required (max 1000 characters)'),
  body('genre').isIn(['fiction', 'romance', 'thriller', 'mystery', 'horror', 'fantasy', 'sci-fi', 'drama', 'comedy', 'biography', 'memoir', 'poetry', 'self-help', 'educational', 'other']).withMessage('Invalid genre'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const storyData = {
      ...req.body,
      author: req.user._id
    };

    const story = await Story.create(storyData);
    await story.populate('author', 'username profile.firstName profile.lastName profile.avatar');

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { 'stats.totalStories': 1 } 
    });

    res.status(201).json({
      message: 'Story created successfully',
      story
    });

  } catch (error) {
    console.error('Create story error:', error.message);
    res.status(500).json({ message: 'Server error creating story' });
  }
});

// @route   PUT /api/stories/:id
// @desc    Update story
// @access  Private (Owner only)
router.put('/:id', protect, checkOwnership(Story), [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('description').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Description must be 1-1000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const story = req.resource;
    const allowedUpdates = ['title', 'description', 'genre', 'tags', 'coverImage', 'status', 'visibility', 'settings'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'settings') {
          story.settings = { ...story.settings, ...req.body.settings };
        } else {
          story[field] = req.body[field];
        }
      }
    });

    await story.save();
    await story.populate('author', 'username profile.firstName profile.lastName profile.avatar');

    res.json({
      message: 'Story updated successfully',
      story
    });

  } catch (error) {
    console.error('Update story error:', error.message);
    res.status(500).json({ message: 'Server error updating story' });
  }
});

// @route   DELETE /api/stories/:id
// @desc    Delete story
// @access  Private (Owner only)
router.delete('/:id', protect, checkOwnership(Story), async (req, res) => {
  try {
    const story = req.resource;

    // Delete all chapters of this story
    await Chapter.deleteMany({ story: story._id });

    // Delete the story
    await Story.findByIdAndDelete(story._id);

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { 
        'stats.totalStories': -1,
        'stats.totalChapters': -story.stats.totalChapters 
      } 
    });

    res.json({ message: 'Story and all chapters deleted successfully' });

  } catch (error) {
    console.error('Delete story error:', error.message);
    res.status(500).json({ message: 'Server error deleting story' });
  }
});

// @route   POST /api/stories/:id/like
// @desc    Like/Unlike a story
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const likeIndex = story.likes.findIndex(like => like.user.toString() === req.user._id.toString());

    if (likeIndex > -1) {
      // Unlike
      story.likes.splice(likeIndex, 1);
      story.stats.totalLikes = Math.max(0, story.stats.totalLikes - 1);
    } else {
      // Like
      story.likes.push({ user: req.user._id });
      story.stats.totalLikes += 1;
    }

    await story.save();

    res.json({
      message: likeIndex > -1 ? 'Story unliked' : 'Story liked',
      isLiked: likeIndex === -1,
      totalLikes: story.stats.totalLikes
    });

  } catch (error) {
    console.error('Like story error:', error.message);
    res.status(500).json({ message: 'Server error processing like' });
  }
});

// @route   POST /api/stories/:id/bookmark
// @desc    Bookmark/Unbookmark a story
// @access  Private
router.post('/:id/bookmark', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const bookmarkIndex = story.bookmarks.findIndex(bookmark => bookmark.user.toString() === req.user._id.toString());

    if (bookmarkIndex > -1) {
      // Remove bookmark
      story.bookmarks.splice(bookmarkIndex, 1);
    } else {
      // Add bookmark
      story.bookmarks.push({ user: req.user._id });
    }

    await story.save();

    res.json({
      message: bookmarkIndex > -1 ? 'Bookmark removed' : 'Story bookmarked',
      isBookmarked: bookmarkIndex === -1
    });

  } catch (error) {
    console.error('Bookmark story error:', error.message);
    res.status(500).json({ message: 'Server error processing bookmark' });
  }
});

// @route   POST /api/stories/:id/rate
// @desc    Rate a story
// @access  Private
router.post('/:id/rate', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const { rating } = req.body;
    const existingRatingIndex = story.ratings.findIndex(r => r.user.toString() === req.user._id.toString());

    if (existingRatingIndex > -1) {
      // Update existing rating
      story.ratings[existingRatingIndex].rating = rating;
    } else {
      // Add new rating
      story.ratings.push({ user: req.user._id, rating });
    }

    // Recalculate average rating
    story.calculateAverageRating();
    await story.save();

    res.json({
      message: 'Rating submitted successfully',
      averageRating: story.stats.averageRating,
      totalRatings: story.stats.totalRatings
    });

  } catch (error) {
    console.error('Rate story error:', error.message);
    res.status(500).json({ message: 'Server error submitting rating' });
  }
});

module.exports = router;
