const express = require('express');
const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notes
// @desc    Get all public notes with filters and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { visibility: 'public' };

    // Author filter
    if (req.query.author) {
      filter.author = req.query.author;
    }

    // Hashtag filter
    if (req.query.hashtag) {
      filter.hashtags = req.query.hashtag.toLowerCase();
    }

    // Sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first

    const notes = await Note.find(filter)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Note.countDocuments(filter);

    res.json({
      notes,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get notes error:', error.message);
    res.status(500).json({ message: 'Server error fetching notes' });
  }
});

// @route   GET /api/notes/feed
// @desc    Get personalized note feed for authenticated user
// @access  Private
router.get('/feed', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get user's following list
    const user = await User.findById(req.user._id).select('following');
    const followingIds = user.following;

    // Include user's own notes and notes from followed users
    const filter = {
      $or: [
        { author: { $in: followingIds } },
        { author: req.user._id }
      ],
      visibility: 'public'
    };

    const notes = await Note.find(filter)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Note.countDocuments(filter);

    res.json({
      notes,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get note feed error:', error.message);
    res.status(500).json({ message: 'Server error fetching note feed' });
  }
});

// @route   GET /api/notes/:id
// @desc    Get single note by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ note });

  } catch (error) {
    console.error('Get note error:', error.message);
    res.status(500).json({ message: 'Server error fetching note' });
  }
});

// @route   POST /api/notes
// @desc    Create new note
// @access  Private
router.post('/', protect, [
  body('content').trim().isLength({ min: 1, max: 280 }).withMessage('Note content is required (max 280 characters)'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const noteData = {
      content: req.body.content,
      author: req.user._id,
      visibility: req.body.visibility || 'public',
      hashtags: req.body.content.match(/#\w+/g) || []
    };

    const note = await Note.create(noteData);
    await note.populate('author', 'username profile.firstName profile.lastName profile.avatar');

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { 'stats.totalNotes': 1 } 
    });

    res.status(201).json({
      message: 'Note created successfully',
      note
    });

  } catch (error) {
    console.error('Create note error:', error.message);
    res.status(500).json({ message: 'Server error creating note' });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update note
// @access  Private (Author only)
router.put('/:id', protect, [
  body('content').trim().isLength({ min: 1, max: 280 }).withMessage('Note content is required (max 280 characters)'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    note.content = req.body.content;
    note.hashtags = req.body.content.match(/#\w+/g) || [];
    note.isEdited = true;
    await note.save();

    await note.populate('author', 'username profile.firstName profile.lastName profile.avatar');

    res.json({
      message: 'Note updated successfully',
      note
    });

  } catch (error) {
    console.error('Update note error:', error.message);
    res.status(500).json({ message: 'Server error updating note' });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete note
// @access  Private (Author only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await note.remove();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { 'stats.totalNotes': -1 } 
    });

    res.json({ message: 'Note deleted successfully' });

  } catch (error) {
    console.error('Delete note error:', error.message);
    res.status(500).json({ message: 'Server error deleting note' });
  }
});

// @route   POST /api/notes/:id/like
// @desc    Like/unlike a note
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const likeIndex = note.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    if (likeIndex === -1) {
      // Add like
      note.likes.push({ user: req.user._id });
      note.stats.likes += 1;
    } else {
      // Remove like
      note.likes.splice(likeIndex, 1);
      note.stats.likes -= 1;
    }

    await note.save();

    res.json({ 
      message: likeIndex === -1 ? 'Note liked' : 'Like removed',
      likes: note.stats.likes
    });

  } catch (error) {
    console.error('Like note error:', error.message);
    res.status(500).json({ message: 'Server error liking note' });
  }
});

// @route   POST /api/notes/:id/repost
// @desc    Repost a note
// @access  Private
router.post('/:id/repost', protect, async (req, res) => {
  try {
    const originalNote = await Note.findById(req.params.id);
    if (!originalNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user has already reposted this note
    const existingRepost = await Note.findOne({
      author: req.user._id,
      reposts: { $elemMatch: { originalNote: req.params.id } }
    });

    if (existingRepost) {
      return res.status(400).json({ message: 'You have already reposted this note' });
    }

    // Create repost
    const repostData = {
      content: req.body.content || '',
      author: req.user._id,
      visibility: 'public',
      reposts: [{
        user: req.user._id,
        originalNote: req.params.id
      }],
      isReply: false
    };

    const repost = await Note.create(repostData);
    await repost.populate('author', 'username profile.firstName profile.lastName profile.avatar');

    // Update original note stats
    originalNote.stats.reposts += 1;
    await originalNote.save();

    res.status(201).json({
      message: 'Note reposted successfully',
      note: repost
    });

  } catch (error) {
    console.error('Repost note error:', error.message);
    res.status(500).json({ message: 'Server error reposting note' });
  }
});

module.exports = router;