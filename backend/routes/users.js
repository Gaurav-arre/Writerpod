const express = require('express');
const User = require('../models/User');
const Story = require('../models/Story');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/me/stories
// @desc    Get all stories by current user (including drafts)
// @access  Private
router.get('/me/stories', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Get all stories by current user, regardless of status
    const stories = await Story.find({ author: req.user._id })
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Story.countDocuments({ author: req.user._id });

    res.json({
      data: stories,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get my stories error:', error.message);
    res.status(500).json({ message: 'Server error fetching your stories' });
  }
});

// @route   GET /api/users
// @desc    Get users with pagination and search
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };

    // Search by username or name
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { username: searchRegex },
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex }
      ];
    }

    // Sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    switch (req.query.sort) {
      case 'followers':
        sortOptions = { 'stats.followersCount': -1 };
        break;
      case 'stories':
        sortOptions = { 'stats.totalStories': -1 };
        break;
      case 'popular':
        sortOptions = { 'stats.totalViews': -1, 'stats.totalLikes': -1 };
        break;
    }

    const users = await User.find(filter)
      .select('-password -email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(filter);

    // Add following status if authenticated
    if (req.user) {
      for (let user of users) {
        user.isFollowing = req.user.following.includes(user._id);
      }
    }

    res.json({
      users,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   GET /api/users/:username
// @desc    Get user profile by username
// @access  Public
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .select('-password')
      .populate('followers', 'username profile.firstName profile.lastName profile.avatar')
      .populate('following', 'username profile.firstName profile.lastName profile.avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's public stories
    const stories = await Story.find({ 
      author: user._id, 
      status: 'published', 
      visibility: 'public' 
    })
    .select('title description genre coverImage stats publishedAt')
    .sort({ publishedAt: -1 })
    .limit(6);

    // Add following status if authenticated
    let isFollowing = false;
    if (req.user) {
      isFollowing = req.user.following.includes(user._id);
    }

    res.json({
      user: {
        ...user.toObject(),
        isFollowing,
        stories
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error.message);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// @route   POST /api/users/:id/follow
// @desc    Follow/Unfollow a user
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);
    
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId },
        $inc: { 'stats.followingCount': -1 }
      });
      
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId },
        $inc: { 'stats.followersCount': -1 }
      });

      res.json({
        message: 'User unfollowed successfully',
        isFollowing: false
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId },
        $inc: { 'stats.followingCount': 1 }
      });
      
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId },
        $inc: { 'stats.followersCount': 1 }
      });

      res.json({
        message: 'User followed successfully',
        isFollowing: true
      });
    }

  } catch (error) {
    console.error('Follow user error:', error.message);
    res.status(500).json({ message: 'Server error processing follow request' });
  }
});

// @route   GET /api/users/:id/stories
// @desc    Get stories by user
// @access  Public
router.get('/:id/stories', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build filter - only show public stories unless it's the user's own profile
    let filter = { author: userId, status: 'published' };
    
    if (!req.user || req.user._id.toString() !== userId) {
      filter.visibility = 'public';
    }

    const stories = await Story.find(filter)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ publishedAt: -1 })
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
    console.error('Get user stories error:', error.message);
    res.status(500).json({ message: 'Server error fetching user stories' });
  }
});

// @route   GET /api/users/:id/followers
// @desc    Get user's followers
// @access  Public
router.get('/:id/followers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id)
      .populate({
        path: 'followers',
        select: 'username profile.firstName profile.lastName profile.avatar stats.followersCount',
        options: { 
          skip: skip,
          limit: limit,
          sort: { 'stats.followersCount': -1 }
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const total = user.stats.followersCount;

    res.json({
      followers: user.followers,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get followers error:', error.message);
    res.status(500).json({ message: 'Server error fetching followers' });
  }
});

// @route   GET /api/users/:id/following
// @desc    Get users that this user is following
// @access  Public
router.get('/:id/following', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id)
      .populate({
        path: 'following',
        select: 'username profile.firstName profile.lastName profile.avatar stats.followersCount',
        options: { 
          skip: skip,
          limit: limit,
          sort: { 'stats.followersCount': -1 }
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const total = user.stats.followingCount;

    res.json({
      following: user.following,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get following error:', error.message);
    res.status(500).json({ message: 'Server error fetching following list' });
  }
});

// @route   GET /api/users/me/bookmarks
// @desc    Get current user's bookmarked stories
// @access  Private
router.get('/me/bookmarks', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const stories = await Story.find({
      'bookmarks.user': req.user._id,
      status: 'published'
    })
    .populate('author', 'username profile.firstName profile.lastName profile.avatar')
    .sort({ 'bookmarks.createdAt': -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await Story.countDocuments({
      'bookmarks.user': req.user._id,
      status: 'published'
    });

    // Add user interaction data
    for (let story of stories) {
      story.isLiked = story.likes.some(like => like.user.toString() === req.user._id.toString());
      story.isBookmarked = true; // Obviously bookmarked since we're fetching bookmarks
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
    console.error('Get bookmarks error:', error.message);
    res.status(500).json({ message: 'Server error fetching bookmarks' });
  }
});



// @route   GET /api/users/me/feed
// @desc    Get personalized feed for current user
// @access  Private
router.get('/me/feed', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Get stories from users the current user is following
    const followingIds = req.user.following;

    const stories = await Story.find({
      author: { $in: followingIds },
      status: 'published',
      visibility: { $in: ['public', 'followers-only'] }
    })
    .populate('author', 'username profile.firstName profile.lastName profile.avatar')
    .populate({
      path: 'chapters',
      match: { status: 'published' },
      select: 'title chapterNumber publishedAt',
      options: { sort: { chapterNumber: 1 }, limit: 3 }
    })
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await Story.countDocuments({
      author: { $in: followingIds },
      status: 'published',
      visibility: { $in: ['public', 'followers-only'] }
    });

    // Add user interaction data
    for (let story of stories) {
      story.isLiked = story.likes.some(like => like.user.toString() === req.user._id.toString());
      story.isBookmarked = story.bookmarks.some(bookmark => bookmark.user.toString() === req.user._id.toString());
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
    console.error('Get feed error:', error.message);
    res.status(500).json({ message: 'Server error fetching feed' });
  }
});

module.exports = router;
