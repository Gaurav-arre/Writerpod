const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2,000 characters']
  },
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'audio', 'video']
    }
  }],
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message' // For replies
  },
  isReply: {
    type: Boolean,
    default: false
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hashtags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    likes: {
      type: Number,
      default: 0
    },
    replies: {
      type: Number,
      default: 0
    }
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ chat: 1, createdAt: 1 });
messageSchema.index({ author: 1 });
messageSchema.index({ parentId: 1 });
messageSchema.index({ hashtags: 1 });
messageSchema.index({ 'stats.likes': -1 });

// Text index for search
messageSchema.index({ content: 'text' });

module.exports = mongoose.model('Message', messageSchema);