const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Publication = require('../models/Publication');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages/chat/:chatId
// @desc    Get all messages for a chat
// @access  Private (chat participants only)
router.get('/chat/:chatId', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is subscribed to the publication
    const publication = await Publication.findById(chat.publication);
    const isSubscribed = publication.subscribers.some(
      sub => sub.user.toString() === req.user._id.toString()
    );

    if (!isSubscribed) {
      return res.status(403).json({ message: 'You must be subscribed to view messages' });
    }

    // Check if chat is locked
    if (chat.isLocked) {
      return res.status(403).json({ message: 'This chat is locked' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get messages with parent-child relationships
    const messages = await Message.find({ chat: req.params.chatId, parentId: null })
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    // Populate replies for each message
    for (let message of messages) {
      message.replies = await Message.find({ parentId: message._id })
        .populate('author', 'username profile.firstName profile.lastName profile.avatar')
        .sort({ createdAt: 1 });
    }

    const total = await Message.countDocuments({ chat: req.params.chatId, parentId: null });

    res.json({
      messages,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get messages error:', error.message);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// @route   POST /api/messages
// @desc    Create new message
// @access  Private (chat participants only)
router.post('/', protect, [
  body('chat').isMongoId().withMessage('Valid chat ID is required'),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message content is required (max 2,000 characters)'),
  body('parentId').optional().isMongoId().withMessage('Valid parent message ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const chat = await Chat.findById(req.body.chat);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is subscribed to the publication
    const publication = await Publication.findById(chat.publication);
    const isSubscribed = publication.subscribers.some(
      sub => sub.user.toString() === req.user._id.toString()
    );

    if (!isSubscribed) {
      return res.status(403).json({ message: 'You must be subscribed to send messages' });
    }

    // Check if chat is locked
    if (chat.isLocked) {
      return res.status(403).json({ message: 'This chat is locked' });
    }

    // Check visibility restrictions
    if (chat.visibility === 'paid_subscribers') {
      const isPaidSubscriber = publication.subscribers.some(
        sub => sub.user.toString() === req.user._id.toString() && sub.subscriptionType === 'paid'
      );
      
      if (!isPaidSubscriber) {
        return res.status(403).json({ message: 'Only paid subscribers can participate in this chat' });
      }
    }

    const messageData = {
      ...req.body,
      author: req.user._id,
      isReply: !!req.body.parentId
    };

    const message = await Message.create(messageData);

    // Update chat stats
    if (req.body.parentId) {
      // It's a reply, update parent message
      await Message.findByIdAndUpdate(req.body.parentId, {
        $inc: { 'stats.replies': 1 }
      });
    } else {
      // It's a new message, update chat
      await Chat.findByIdAndUpdate(req.body.chat, {
        $inc: { 'stats.messages': 1 }
      });
    }

    await message.populate('author', 'username profile.firstName profile.lastName profile.avatar');

    res.status(201).json({
      message: 'Message sent successfully',
      message
    });

  } catch (error) {
    console.error('Create message error:', error.message);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// @route   PUT /api/messages/:id
// @desc    Update message
// @access  Private (message author only)
router.put('/:id', protect, [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message content is required (max 2,000 characters)'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only message authors can update messages' });
    }

    message.content = req.body.content;
    message.isEdited = true;
    await message.save();

    await message.populate('author', 'username profile.firstName profile.lastName profile.avatar');

    res.json({
      message: 'Message updated successfully',
      message
    });

  } catch (error) {
    console.error('Update message error:', error.message);
    res.status(500).json({ message: 'Server error updating message' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete message
// @access  Private (message author or chat/publication owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const chat = await Chat.findById(message.chat);
    const publication = await Publication.findById(chat.publication);
    
    // Check if user is message author, chat author, or publication owner
    const isAuthorized = 
      message.author.toString() === req.user._id.toString() ||
      chat.author.toString() === req.user._id.toString() ||
      publication.owner.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to delete this message' });
    }

    // If it's a parent message, delete all replies
    if (!message.parentId) {
      await Message.deleteMany({ parentId: message._id });
    }

    await message.remove();
    
    // Update chat stats
    if (!message.parentId) {
      await Chat.findByIdAndUpdate(message.chat, {
        $inc: { 'stats.messages': -1 }
      });
    } else {
      // Update parent message reply count
      await Message.findByIdAndUpdate(message.parentId, {
        $inc: { 'stats.replies': -1 }
      });
    }
    
    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('Delete message error:', error.message);
    res.status(500).json({ message: 'Server error deleting message' });
  }
});

// @route   POST /api/messages/:id/like
// @desc    Like/unlike a message
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is subscribed to the publication
    const chat = await Chat.findById(message.chat);
    const publication = await Publication.findById(chat.publication);
    const isSubscribed = publication.subscribers.some(
      sub => sub.user.toString() === req.user._id.toString()
    );

    if (!isSubscribed) {
      return res.status(403).json({ message: 'You must be subscribed to like messages' });
    }

    const likeIndex = message.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    if (likeIndex === -1) {
      // Add like
      message.likes.push({ user: req.user._id });
      message.stats.likes += 1;
    } else {
      // Remove like
      message.likes.splice(likeIndex, 1);
      message.stats.likes -= 1;
    }

    await message.save();

    res.json({ 
      message: likeIndex === -1 ? 'Message liked' : 'Like removed',
      likes: message.stats.likes
    });

  } catch (error) {
    console.error('Like message error:', error.message);
    res.status(500).json({ message: 'Server error liking message' });
  }
});

module.exports = router;