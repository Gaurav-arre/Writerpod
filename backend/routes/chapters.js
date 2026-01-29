const express = require('express');
const { body, validationResult } = require('express-validator');
const Chapter = require('../models/Chapter');
const Story = require('../models/Story');
const User = require('../models/User');
const { protect, checkOwnership, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chapters/story/:storyId/next-number
// @desc    Get the next chapter number for a story
// @access  Private
router.get('/story/:storyId/next-number', protect, async (req, res) => {
  try {
    const { storyId } = req.params;
    
    // Validate storyId
    if (!storyId || storyId === 'undefined' || storyId === 'null') {
      return res.status(400).json({ message: 'Valid story ID is required' });
    }
    
    // Check if story exists and user is owner
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const lastChapter = await Chapter.findOne({ story: storyId })
      .sort({ chapterNumber: -1 })
      .select('chapterNumber');
    
    const nextNumber = lastChapter ? lastChapter.chapterNumber + 1 : 1;
    
    res.json({ nextNumber });
  } catch (error) {
    console.error('Get next chapter number error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chapters/story/:storyId
// @desc    Get all chapters for a story
// @access  Public
router.get('/story/:storyId', optionalAuth, async (req, res) => {
  try {
    const { storyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate storyId
    if (!storyId || storyId === 'undefined' || storyId === 'null') {
      return res.status(400).json({ message: 'Valid story ID is required', chapters: [] });
    }

    // Get story to check permissions
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user can view this story
    let filter = { story: storyId };
    
    if (story.visibility === 'private' && (!req.user || story.author.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'This story is private' });
    }

    if (story.visibility === 'followers-only' && req.user) {
      const author = await User.findById(story.author);
      if (!author.followers.includes(req.user._id) && story.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'This story is only available to followers' });
      }
    }

    // Only show published chapters unless user is the author
    if (!req.user || req.user._id.toString() !== story.author.toString()) {
      filter.status = 'published';
    }

    const chapters = await Chapter.find(filter)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ chapterNumber: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Chapter.countDocuments(filter);

    // Add user interaction data
    if (req.user) {
      for (let chapter of chapters) {
        chapter.isLiked = chapter.likes && chapter.likes.some(like => like.user.toString() === req.user._id.toString());
      }
    }

    res.json({
      chapters,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get chapters error:', error.message);
    res.status(500).json({ message: 'Server error fetching chapters' });
  }
});

// @route   GET /api/chapters/:id
// @desc    Get single chapter by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .populate('story', 'title author visibility status');

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    // Check if user can view this chapter
    const story = chapter.story;
    
    if (story.visibility === 'private' && (!req.user || story.author.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'This chapter is private' });
    }

    if (story.visibility === 'followers-only' && req.user) {
      const author = await User.findById(story.author);
      if (!author.followers.includes(req.user._id) && story.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'This chapter is only available to followers' });
      }
    }

    // Check if chapter is published or user is the author
    if (chapter.status !== 'published' && (!req.user || req.user._id.toString() !== chapter.author._id.toString())) {
      return res.status(403).json({ message: 'This chapter is not yet published' });
    }

    // Increment view count (but not for the author)
    if (!req.user || req.user._id.toString() !== chapter.author._id.toString()) {
      await Chapter.findByIdAndUpdate(chapter._id, { $inc: { 'stats.views': 1 } });
      await Story.findByIdAndUpdate(story._id, { $inc: { 'stats.totalViews': 1 } });
    }

    // Add user interaction data
    let userInteraction = {};
    if (req.user) {
      userInteraction.isLiked = chapter.likes && chapter.likes.some(like => like.user.toString() === req.user._id.toString());
    }

    res.json({
      chapter: {
        ...chapter.toObject(),
        userInteraction
      }
    });

  } catch (error) {
    console.error('Get chapter error:', error.message);
    res.status(500).json({ message: 'Server error fetching chapter' });
  }
});

// @route   POST /api/chapters
// @desc    Create new chapter
// @access  Private
router.post('/', protect, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 characters)'),
  body('content').trim().isLength({ min: 1, max: 50000 }).withMessage('Content is required (max 50,000 characters)'),
  body('story').isMongoId().withMessage('Valid story ID is required'),
  body('chapterNumber').isInt({ min: 1 }).withMessage('Chapter number must be a positive integer'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { story: storyId, chapterNumber } = req.body;

    // Check if user owns the story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only add chapters to your own stories' });
    }

    // Check if chapter number already exists
    const existingChapter = await Chapter.findOne({ story: storyId, chapterNumber });
    if (existingChapter) {
      return res.status(400).json({ message: 'A chapter with this number already exists' });
    }

    const chapterData = {
      ...req.body,
      author: req.user._id,
      audioSettings: {
        voice: req.body.audioSettings?.voice || 'default',
        speed: req.body.audioSettings?.speed || 1.0,
        pitch: req.body.audioSettings?.pitch || 1.0,
        backgroundMusic: req.body.audioSettings?.backgroundMusic || 'none'
      }
    };

    const chapter = await Chapter.create(chapterData);
    await chapter.populate('author', 'username profile.firstName profile.lastName profile.avatar');

    // Update story stats
    const storyUpdate = { 
      $inc: { 'stats.totalChapters': 1 },
      $push: { chapters: chapter._id }
    };

    // If this chapter is being published, ensure the story is also marked as published
    if (req.body.status === 'published' && story.status === 'draft') {
      storyUpdate.status = 'published';
      storyUpdate.publishedAt = new Date();
    }

    await Story.findByIdAndUpdate(storyId, storyUpdate);

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { 'stats.totalChapters': 1 } 
    });

    res.status(201).json({
      message: 'Chapter created successfully',
      chapter
    });

  } catch (error) {
    console.error('Create chapter error:', error.message);
    res.status(500).json({ message: 'Server error creating chapter' });
  }
});

// @route   PUT /api/chapters/:id
// @desc    Update chapter
// @access  Private (Owner only)
router.put('/:id', protect, checkOwnership(Chapter), [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('content').optional().trim().isLength({ min: 1, max: 50000 }).withMessage('Content must be 1-50,000 characters'),
], async (req, res) => {
  try {
    // Log request body for debugging
    console.log('PUT /api/chapters/:id - Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const chapter = req.resource;
    const allowedUpdates = ['title', 'content', 'status', 'audioSettings'];
    
    // Store original values for comparison
    const originalChapterNumber = chapter.chapterNumber;
    const originalStory = chapter.story.toString();
    
    // Check if chapterNumber is being updated AND it's actually different
    if (req.body.chapterNumber !== undefined && req.body.chapterNumber !== originalChapterNumber) {
      const newChapterNumber = req.body.chapterNumber;
      
      // Log for debugging
      console.log('Chapter number update check:');
      console.log('Request chapterNumber:', newChapterNumber);
      console.log('Current chapterNumber:', originalChapterNumber);
      console.log('Are they different?', newChapterNumber !== originalChapterNumber);
      
      // If chapter number is being changed, check if the new number already exists
      const existingChapter = await Chapter.findOne({ 
        story: originalStory, 
        chapterNumber: newChapterNumber,
        _id: { $ne: chapter._id } // Exclude current chapter
      });
      
      console.log('Existing chapter found:', existingChapter);
      
      if (existingChapter) {
        return res.status(400).json({ message: 'A chapter with this number already exists' });
      }
    }
    
    // Apply updates
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'audioSettings') {
          chapter.audioSettings = { ...chapter.audioSettings, ...req.body.audioSettings };
        } else {
          chapter[field] = req.body[field];
        }
      }
    });

    // Log before saving for debugging
    console.log('About to save chapter:', {
      id: chapter._id,
      title: chapter.title,
      chapterNumber: chapter.chapterNumber,
      story: chapter.story,
      status: chapter.status
    });

    await chapter.save();
    await chapter.populate('author', 'username profile.firstName profile.lastName profile.avatar');

    // If this chapter was just published, ensure the story is also marked as published
    if (req.body.status === 'published') {
      const story = await Story.findById(chapter.story);
      if (story && story.status === 'draft') {
        await Story.findByIdAndUpdate(story._id, {
          status: 'published',
          publishedAt: new Date()
        });
      }
    }

    res.json({
      message: 'Chapter updated successfully',
      chapter
    });

  } catch (error) {
    console.error('Update chapter error:', error.message);
    console.error('Update chapter stack:', error.stack);
    
    // Check if it's a duplicate key error
    if (error.code === 11000) {
      // Extract the duplicate key information
      const duplicateKeyInfo = error.keyValue || {};
      if (duplicateKeyInfo.chapterNumber) {
        return res.status(400).json({ message: 'A chapter with this number already exists' });
      }
      // For other duplicate key errors, return a generic message
      return res.status(400).json({ message: 'Duplicate key error occurred' });
    }
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: Object.values(error.errors).map(err => err.message) });
    }
    
    res.status(500).json({ message: 'Server error updating chapter' });
  }
});

// @route   DELETE /api/chapters/:id
// @desc    Delete chapter
// @access  Private (Owner only)
router.delete('/:id', protect, checkOwnership(Chapter), async (req, res) => {
  try {
    const chapter = req.resource;
    const storyId = chapter.story;

    // Remove chapter from story
    await Story.findByIdAndUpdate(storyId, { 
      $pull: { chapters: chapter._id },
      $inc: { 'stats.totalChapters': -1 }
    });

    // Delete the chapter
    await Chapter.findByIdAndDelete(chapter._id);

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { 'stats.totalChapters': -1 } 
    });

    res.json({ message: 'Chapter deleted successfully' });

  } catch (error) {
    console.error('Delete chapter error:', error.message);
    res.status(500).json({ message: 'Server error deleting chapter' });
  }
});

// @route   POST /api/chapters/:id/like
// @desc    Like/Unlike a chapter
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    const likeIndex = chapter.likes.findIndex(like => like.user.toString() === req.user._id.toString());

    if (likeIndex > -1) {
      // Unlike
      chapter.likes.splice(likeIndex, 1);
      chapter.stats.likes = Math.max(0, chapter.stats.likes - 1);
    } else {
      // Like
      chapter.likes.push({ user: req.user._id });
      chapter.stats.likes += 1;
    }

    await chapter.save();

    res.json({
      message: likeIndex > -1 ? 'Chapter unliked' : 'Chapter liked',
      isLiked: likeIndex === -1,
      totalLikes: chapter.stats.likes
    });

  } catch (error) {
    console.error('Like chapter error:', error.message);
    res.status(500).json({ message: 'Server error processing like' });
  }
});

// @route   POST /api/chapters/:id/comment
// @desc    Add comment to chapter
// @access  Private
router.post('/:id/comment', protect, [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    const comment = {
      user: req.user._id,
      content: req.body.content
    };

    chapter.comments.push(comment);
    chapter.stats.comments += 1;
    await chapter.save();

    // Populate the new comment with user data
    await chapter.populate({
      path: 'comments.user',
      select: 'username profile.firstName profile.lastName profile.avatar',
      match: { _id: comment.user }
    });

    const newComment = chapter.comments[chapter.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });

  } catch (error) {
    console.error('Add comment error:', error.message);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// @route   DELETE /api/chapters/:id/comment/:commentId
// @desc    Delete comment from chapter
// @access  Private (Comment owner only)
router.delete('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    const comment = chapter.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or the chapter
    if (comment.user.toString() !== req.user._id.toString() && chapter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    chapter.comments.pull(comment);
    chapter.stats.comments = Math.max(0, chapter.stats.comments - 1);
    await chapter.save();

    res.json({ message: 'Comment deleted successfully' });

  } catch (error) {
    console.error('Delete comment error:', error.message);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
});

module.exports = router;
