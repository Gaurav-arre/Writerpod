const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Story title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Story description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  content: {
    type: String,
    maxlength: [50000, 'Content cannot exceed 50,000 characters'] // For short posts/notes
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    enum: [
      'fiction', 'romance', 'thriller', 'mystery', 'horror', 'fantasy', 
      'sci-fi', 'drama', 'comedy', 'biography', 'memoir', 'poetry', 
      'self-help', 'educational', 'other', 'news', 'interview', 'how-to',
      'link-roundup', 'discussion', 'audio', 'video', 'note'
    ]
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Each tag cannot exceed 30 characters']
  }],
  coverImage: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'completed', 'paused'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'followers-only'],
    default: 'public'
  },
  language: {
    type: String,
    default: 'english'
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowLikes: {
      type: Boolean,
      default: true
    },
    backgroundMusic: {
      type: String,
      default: 'none'
    },
    voiceSettings: {
      voice: {
        type: String,
        default: 'default'
      },
      speed: {
        type: Number,
        default: 1.0,
        min: 0.5,
        max: 2.0
      },
      pitch: {
        type: Number,
        default: 1.0,
        min: 0.5,
        max: 2.0
      }
    },
    isNewsletter: {
      type: Boolean,
      default: false
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    }
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
  
  isNote: {
    type: Boolean,
    default: false
  },
  
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story' // For replies and threads
  },
  
  publication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Publication'
  },
  
  scheduledAt: {
    type: Date
  },
  
  chapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
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
  bookmarks: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  purchases: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    },
    price: {
      type: Number
    }
  }],
  
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    totalChapters: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    },
    totalShares: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  publishedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Update published date when status changes to published
storySchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Calculate average rating
storySchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.stats.averageRating = 0;
    return 0;
  }
  
  const total = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
  const average = total / this.ratings.length;
  this.stats.averageRating = Math.round(average * 10) / 10; // Round to 1 decimal place
  this.stats.totalRatings = this.ratings.length;
  
  return this.stats.averageRating;
};

// Text search index
storySchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
});

// Compound indexes for common queries
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ status: 1, createdAt: -1 });
storySchema.index({ genre: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
