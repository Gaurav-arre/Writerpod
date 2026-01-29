const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Chat title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  publication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Publication',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: [5000, 'Content cannot exceed 5,000 characters']
  },
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'audio', 'video']
    },
    caption: String
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['subscribers', 'paid_subscribers'],
    default: 'subscribers'
  },
  stats: {
    messages: {
      type: Number,
      default: 0
    },
    participants: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    }
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date
    }
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
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
chatSchema.index({ publication: 1, createdAt: -1 });
chatSchema.index({ author: 1 });
chatSchema.index({ tags: 1 });
chatSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);