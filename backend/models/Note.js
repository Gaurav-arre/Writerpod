const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Note content is required'],
    maxlength: [280, 'Note cannot exceed 280 characters'] // Twitter-like limit
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Publication'
  },
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video', 'audio']
    }
  }],
  stats: {
    likes: {
      type: Number,
      default: 0
    },
    reposts: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    }
  },
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
  reposts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    originalNote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hashtags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  isReply: {
    type: Boolean,
    default: false
  },
  parentNote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
noteSchema.index({ author: 1, createdAt: -1 });
noteSchema.index({ hashtags: 1 });
noteSchema.index({ mentions: 1 });
noteSchema.index({ 'stats.likes': -1 });
noteSchema.index({ 'stats.reposts': -1 });

// Text index for search
noteSchema.index({ content: 'text' });

module.exports = mongoose.model('Note', noteSchema);