const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Publication',
    required: true
  },
  tier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Publication.subscriptionTiers'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank', 'crypto'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  nextBillingDate: {
    type: Date
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  trialEndsAt: {
    type: Date
  },
  isTrial: {
    type: Boolean,
    default: false
  },
  cancellationReason: {
      type: String
  },
  metadata: {
    paymentIntentId: String,
    customerId: String,
    subscriptionId: String // For external payment providers
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
subscriptionSchema.index({ user: 1, publication: 1 }, { unique: true });
subscriptionSchema.index({ publication: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);