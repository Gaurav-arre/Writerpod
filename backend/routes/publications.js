const express = require('express');
const { body, validationResult } = require('express-validator');
const Publication = require('../models/Publication');
const Story = require('../models/Story');
const User = require('../models/User');
const { protect, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/publications
// @desc    Get all publications
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Search functionality
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Sort options
    let sortOptions = { 'stats.subscribers': -1 }; // Default: most subscribers first
    
    switch (req.query.sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
    }

    const publications = await Publication.find(filter)
      .populate('owner', 'username profile.firstName profile.lastName profile.avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Publication.countDocuments(filter);

    res.json({
      publications,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get publications error:', error.message);
    res.status(500).json({ message: 'Server error fetching publications' });
  }
});

// @route   GET /api/publications/:id
// @desc    Get single publication by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id)
      .populate('owner', 'username profile.firstName profile.lastName profile.avatar stats.followersCount');

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    // Get recent stories for this publication
    const stories = await Story.find({ 
      publication: publication._id, 
      status: 'published' 
    })
    .populate('author', 'username profile.firstName profile.lastName profile.avatar')
    .sort({ publishedAt: -1 })
    .limit(10);

    res.json({
      publication,
      stories
    });

  } catch (error) {
    console.error('Get publication error:', error.message);
    res.status(500).json({ message: 'Server error fetching publication' });
  }
});

// @route   POST /api/publications
// @desc    Create new publication
// @access  Private
router.post('/', protect, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Publication name is required (max 100 characters)'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('slug').trim().isLength({ min: 1 }).withMessage('Slug is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    // Check if slug is already taken
    const existingPublication = await Publication.findOne({ slug: req.body.slug });
    if (existingPublication) {
      return res.status(400).json({ message: 'Publication slug already taken' });
    }

    const publicationData = {
      ...req.body,
      owner: req.user._id
    };

    const publication = await Publication.create(publicationData);

    // Add publication to user's publications
    await User.findByIdAndUpdate(req.user._id, {
      $push: { publications: publication._id }
    });

    await publication.populate('owner', 'username profile.firstName profile.lastName profile.avatar');

    res.status(201).json({
      message: 'Publication created successfully',
      publication
    });

  } catch (error) {
    console.error('Create publication error:', error.message);
    res.status(500).json({ message: 'Server error creating publication' });
  }
});

// @route   PUT /api/publications/:id
// @desc    Update publication
// @access  Private (Owner only)
router.put('/:id', protect, checkOwnership(Publication), [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Publication name must be 1-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const publication = await Publication.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('owner', 'username profile.firstName profile.lastName profile.avatar');

    res.json({
      message: 'Publication updated successfully',
      publication
    });

  } catch (error) {
    console.error('Update publication error:', error.message);
    res.status(500).json({ message: 'Server error updating publication' });
  }
});

// @route   DELETE /api/publications/:id
// @desc    Delete publication
// @access  Private (Owner only)
router.delete('/:id', protect, checkOwnership(Publication), async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    
    // Delete all stories associated with this publication
    await Story.deleteMany({ publication: publication._id });
    
    // Remove publication from user's publications
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { publications: publication._id }
    });
    
    await publication.remove();
    
    res.json({ message: 'Publication deleted successfully' });

  } catch (error) {
    console.error('Delete publication error:', error.message);
    res.status(500).json({ message: 'Server error deleting publication' });
  }
});

// @route   POST /api/publications/:id/subscribe
// @desc    Subscribe to publication
// @access  Private
router.post('/:id/subscribe', protect, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    // Check if user is already subscribed
    const isSubscribed = publication.subscribers.some(
      sub => sub.user.toString() === req.user._id.toString()
    );

    if (isSubscribed) {
      return res.status(400).json({ message: 'Already subscribed to this publication' });
    }

    // Add subscriber
    publication.subscribers.push({
      user: req.user._id,
      subscriptionType: 'free'
    });

    publication.stats.subscribers += 1;
    await publication.save();

    // Update user's subscription
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        subscriptions: {
          publication: publication._id,
          subscribedAt: Date.now()
        }
      }
    });

    res.json({ 
      message: 'Successfully subscribed to publication',
      subscribers: publication.stats.subscribers
    });

  } catch (error) {
    console.error('Subscribe to publication error:', error.message);
    res.status(500).json({ message: 'Server error subscribing to publication' });
  }
});

// @route   POST /api/publications/:id/unsubscribe
// @desc    Unsubscribe from publication
// @access  Private
router.post('/:id/unsubscribe', protect, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    // Check if user is subscribed
    const subscriptionIndex = publication.subscribers.findIndex(
      sub => sub.user.toString() === req.user._id.toString()
    );

    if (subscriptionIndex === -1) {
      return res.status(400).json({ message: 'Not subscribed to this publication' });
    }

    // Remove subscriber
    publication.subscribers.splice(subscriptionIndex, 1);
    publication.stats.subscribers -= 1;
    await publication.save();

    // Update user's subscription
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { subscriptions: { publication: publication._id } }
    });

    res.json({ 
      message: 'Successfully unsubscribed from publication',
      subscribers: publication.stats.subscribers
    });

  } catch (error) {
    console.error('Unsubscribe from publication error:', error.message);
    res.status(500).json({ message: 'Server error unsubscribing from publication' });
  }
});

module.exports = router;