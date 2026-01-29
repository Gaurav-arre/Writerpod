const mongoose = require('mongoose');

const characterVoiceSchema = new mongoose.Schema({
  characterName: { type: String, required: true },
  voiceId: { type: String, required: true },
  voiceName: { type: String },
  color: { type: String, default: '#6366f1' }
}, { _id: false });

const audioVersionSchema = new mongoose.Schema({
  audioFile: { type: String, required: true },
  version: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  settings: {
    voice: String,
    speed: Number,
    pitch: Number,
    backgroundMusic: String,
    musicVolume: Number
  }
});

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Chapter title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Chapter content is required'],
    maxlength: [50000, 'Content cannot exceed 50,000 characters']
  },
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chapterNumber: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  publishFormat: {
    type: String,
    enum: ['text', 'audio', 'both'],
    default: 'both'
  },
  scheduledAt: {
    type: Date
  },
  postType: {
    type: String,
    enum: ['article', 'note', 'audio', 'video', 'discussion'],
    default: 'article'
  },
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'audio', 'video']
    },
    caption: String
  }],
  audioFile: {
    type: String,
    default: ''
  },
  audioSettings: {
    voice: { type: String, default: 'default' },
    speed: { type: Number, default: 1.0, min: 0.5, max: 2.0 },
    pitch: { type: Number, default: 1.0, min: 0.5, max: 2.0 },
    stability: { type: Number, default: 0.5, min: 0, max: 1 },
    clarity: { type: Number, default: 0.75, min: 0, max: 1 },
    pauseBetweenParagraphs: { type: Number, default: 0.8 },
    pauseBetweenSentences: { type: Number, default: 0.3 }
  },
  characterVoices: [characterVoiceSchema],
  backgroundMusic: {
    trackId: { type: String, default: 'none' },
    trackName: { type: String, default: 'No Music' },
    volume: { type: Number, default: 0.15, min: 0, max: 1 },
    fadeIn: { type: Boolean, default: true },
    fadeOut: { type: Boolean, default: true },
    autoDuck: { type: Boolean, default: true },
    duckLevel: { type: Number, default: 0.3 }
  },
  soundEffects: [{
    effectId: String,
    effectName: String,
    timestamp: Number,
    volume: { type: Number, default: 0.5 }
  }],
  audioVersionHistory: [audioVersionSchema],
  metadata: {
    wordCount: { type: Number, default: 0 },
    estimatedReadTime: { type: Number, default: 0 },
    estimatedListenTime: { type: Number, default: 0 },
    audioDuration: { type: Number, default: 0 }
  },
  stats: {
    views: { type: Number, default: 0 },
    reads: { type: Number, default: 0 },
    listens: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true, maxlength: [500, 'Comment cannot exceed 500 characters'] },
    createdAt: { type: Date, default: Date.now }
  }],
  publishedAt: { type: Date }
}, {
  timestamps: true
});

chapterSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const words = this.content.trim().split(/\s+/).filter(word => word.length > 0);
    this.metadata.wordCount = words.length;
    this.metadata.estimatedReadTime = Math.ceil(words.length / 250);
    this.metadata.estimatedListenTime = Math.ceil(words.length / 180);
  }
  
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

chapterSchema.methods.updateStats = function() {
  this.stats.likes = this.likes.length;
  this.stats.comments = this.comments.length;
};

chapterSchema.index({ story: 1, chapterNumber: 1 }, { unique: true });
chapterSchema.index({ story: 1, status: 1, chapterNumber: 1 });
chapterSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Chapter', chapterSchema);