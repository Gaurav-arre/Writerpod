const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Publication name is required'],
    trim: true,
    maxlength: [100, 'Publication name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  headerImage: {
    type: String,
    default: ''
  },
  theme: {
    primaryColor: {
      type: String,
      default: '#3b82f6'
    },
    secondaryColor: {
      type: String,
      default: '#1e40af'
    },
    fontFamily: {
      type: String,
      default: 'sans-serif'
    }
  },
  settings: {
    enableComments: {
      type: Boolean,
      default: true
    },
    enableNewsletter: {
      type: Boolean,
      default: true
    },
    newsletterFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'weekly'
    },
    subscriptionPrice: {
      type: Number,
      default: 0, // Free by default
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    enablePayPerPost: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    subscribers: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    totalPosts: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    }
  },
  subscribers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    subscriptionType: {
      type: String,
      enum: ['free', 'paid'],
      default: 'free'
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  subscriptionTiers: [{
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    features: [{
      type: String
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  payoutSettings: {
    method: {
      type: String,
      enum: ['paypal', 'bank', 'stripe'],
      default: 'paypal'
    },
    email: {
      type: String,
      trim: true
    },
    bankDetails: {
      accountNumber: String,
      routingNumber: String,
      bankName: String
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
publicationSchema.index({ owner: 1 });
publicationSchema.index({ slug: 1 });
publicationSchema.index({ 'stats.subscribers': -1 });

module.exports = mongoose.model('Publication', publicationSchema);