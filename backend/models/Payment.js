const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Publication'
  },
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story'
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  type: {
    type: String,
    enum: ['subscription', 'tip', 'pay_per_post', 'payout'],
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
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank', 'crypto', 'balance'],
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  metadata: {
    provider: {
      type: String,
      enum: ['stripe', 'paypal', 'manual', 'crypto']
    },
    providerTransactionId: String,
    description: String,
    fees: {
      type: Number,
      default: 0
    }
  },
  refundedAt: {
    type: Date
  },
  refundReason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ user: 1 });
paymentSchema.index({ publication: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);