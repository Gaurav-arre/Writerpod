const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Publication = require('../models/Publication');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chats/publication/:publicationId
// @desc    Get all chats for a publication
// @access  Private (subscribers only)
router.get('/publication/:publicationId', protect, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.publicationId);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    // Check if user is subscribed to the publication
    const isSubscribed = publication.subscribers.some(
      sub => sub.user.toString() === req.user._id.toString()
    );

    if (!isSubscribed) {
      return res.status(403).json({ message: 'You must be subscribed to view chats' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Only get chats user has access to
    const filter = { publication: req.params.publicationId };
    
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    const chats = await Chat.find(filter)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Chat.countDocuments(filter);

    res.json({
      chats,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get chats error:', error.message);
    res.status(500).json({ message: 'Server error fetching chats' });
  }
});

// @route   GET /api/chats/:id
// @desc    Get single chat by ID
// @access  Private (subscribers only)
router.get('/:id', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .populate('publication', 'name slug');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is subscribed to the publication
    const publication = await Publication.findById(chat.publication);
    const isSubscribed = publication.subscribers.some(
      sub => sub.user.toString() === req.user._id.toString()
    );

    if (!isSubscribed) {
      return res.status(403).json({ message: 'You must be subscribed to view this chat' });
    }

    // Add user to participants if not already there
    const isParticipant = chat.participants.some(
      participant => participant.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      chat.participants.push({
        user: req.user._id,
        joinedAt: Date.now()
      });
      chat.stats.participants += 1;
      await chat.save();
      
      // Update user's chat participants
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: {
          chatParticipants: {
            chat: chat._id,
            joinedAt: Date.now()
          }
        }
      });
    }

    res.json({ chat });

  } catch (error) {
    console.error('Get chat error:', error.message);
    res.status(500).json({ message: 'Server error fetching chat' });
  }
});

// @route   POST /api/chats
// @desc    Create new chat
// @access  Private (publication owners only)
router.post('/', protect, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Chat title is required (max 200 characters)'),
  body('publication').isMongoId().withMessage('Valid publication ID is required'),
  body('content').optional().trim().isLength({ max: 5000 }).withMessage('Content cannot exceed 5,000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    // Check if user owns the publication
    const publication = await Publication.findById(req.body.publication);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    if (publication.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only publication owners can create chats' });
    }

    const chatData = {
      ...req.body,
      author: req.user._id
    };

    const chat = await Chat.create(chatData);

    // Add author as participant
    chat.participants.push({
      user: req.user._id,
      joinedAt: Date.now()
    });
    chat.stats.participants = 1;
    await chat.save();

    await chat.populate('author', 'username profile.firstName profile.lastName profile.avatar');

    res.status(201).json({
      message: 'Chat created successfully',
      chat
    });

  } catch (error) {
    console.error('Create chat error:', error.message);
    res.status(500).json({ message: 'Server error creating chat' });
  }
});

// @route   PUT /api/chats/:id
// @desc    Update chat
// @access  Private (chat author only)
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Chat title must be 1-200 characters'),
  body('content').optional().trim().isLength({ max: 5000 }).withMessage('Content cannot exceed 5,000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (chat.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only chat authors can update chats' });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('author', 'username profile.firstName profile.lastName profile.avatar');

    res.json({
      message: 'Chat updated successfully',
      chat: updatedChat
    });

  } catch (error) {
    console.error('Update chat error:', error.message);
    res.status(500).json({ message: 'Server error updating chat' });
  }
});

// @route   DELETE /api/chats/:id
// @desc    Delete chat
// @access  Private (chat author or publication owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const publication = await Publication.findById(chat.publication);
    
    // Check if user is chat author or publication owner
    if (chat.author.toString() !== req.user._id.toString() && 
        publication.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only chat authors or publication owners can delete chats' });
    }

    // Delete all messages in this chat
    await Message.deleteMany({ chat: chat._id });
    
    await chat.remove();
    
    res.json({ message: 'Chat deleted successfully' });

  } catch (error) {
    console.error('Delete chat error:', error.message);
    res.status(500).json({ message: 'Server error deleting chat' });
  }
});

// @route   POST /api/chats/:id/like
// @desc    Like/unlike a chat
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is subscribed to the publication
    const publication = await Publication.findById(chat.publication);
    const isSubscribed = publication.subscribers.some(
      sub => sub.user.toString() === req.user._id.toString()
    );

    if (!isSubscribed) {
      return res.status(403).json({ message: 'You must be subscribed to like chats' });
    }

    const likeIndex = chat.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    if (likeIndex === -1) {
      // Add like
      chat.likes.push({ user: req.user._id });
      chat.stats.likes += 1;
    } else {
      // Remove like
      chat.likes.splice(likeIndex, 1);
      chat.stats.likes -= 1;
    }

    await chat.save();

    res.json({ 
      message: likeIndex === -1 ? 'Chat liked' : 'Like removed',
      likes: chat.stats.likes
    });

  } catch (error) {
    console.error('Like chat error:', error.message);
    res.status(500).json({ message: 'Server error liking chat' });
  }
});

module.exports = router;