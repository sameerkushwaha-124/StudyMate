const mongoose = require('mongoose');

const BlockedUserSchema = new mongoose.Schema({
  // Primary identifier (username or email pattern)
  identifier: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  // Type of block
  blockType: {
    type: String,
    enum: ['username', 'email', 'pattern'],
    required: true
  },
  
  // Original user information before blocking
  originalUserInfo: {
    username: String,
    email: String,
    userId: String
  },
  
  // Block details
  blockedBy: {
    type: String,
    required: true // Admin email who blocked the user
  },
  
  blockedAt: {
    type: Date,
    default: Date.now
  },
  
  blockReason: {
    type: String,
    required: true
  },
  
  // Additional patterns to block (for comprehensive blocking)
  additionalPatterns: [{
    pattern: String,
    type: {
      type: String,
      enum: ['username', 'email']
    }
  }],
  
  // Statistics
  blockedAccountsCount: {
    type: Number,
    default: 0
  },
  
  lastAttemptAt: {
    type: Date,
    default: null
  },
  
  attemptCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for fast lookups
BlockedUserSchema.index({ identifier: 1 });
BlockedUserSchema.index({ blockType: 1 });
BlockedUserSchema.index({ 'originalUserInfo.username': 1 });
BlockedUserSchema.index({ 'originalUserInfo.email': 1 });

// Method to check if a username/email is blocked
BlockedUserSchema.statics.isBlocked = async function(username, email) {
  const checks = [
    { identifier: username.toLowerCase(), blockType: 'username' },
    { identifier: email.toLowerCase(), blockType: 'email' }
  ];
  
  // Check for exact matches
  const exactMatch = await this.findOne({
    $or: checks
  });
  
  if (exactMatch) {
    // Update attempt statistics
    await this.updateOne(
      { _id: exactMatch._id },
      { 
        $inc: { attemptCount: 1 },
        $set: { lastAttemptAt: new Date() }
      }
    );
    return {
      blocked: true,
      reason: exactMatch.blockReason,
      blockedAt: exactMatch.blockedAt,
      blockedBy: exactMatch.blockedBy
    };
  }
  
  // Check for pattern matches
  const patternBlocks = await this.find({ blockType: 'pattern' });
  
  for (const block of patternBlocks) {
    const pattern = new RegExp(block.identifier, 'i');
    if (pattern.test(username) || pattern.test(email)) {
      // Update attempt statistics
      await this.updateOne(
        { _id: block._id },
        { 
          $inc: { attemptCount: 1 },
          $set: { lastAttemptAt: new Date() }
        }
      );
      return {
        blocked: true,
        reason: block.blockReason,
        blockedAt: block.blockedAt,
        blockedBy: block.blockedBy
      };
    }
  }
  
  return { blocked: false };
};

// Method to add a new block
BlockedUserSchema.statics.addBlock = async function(identifier, blockType, originalUserInfo, blockedBy, blockReason, additionalPatterns = []) {
  const blockData = {
    identifier: identifier.toLowerCase(),
    blockType,
    originalUserInfo,
    blockedBy,
    blockReason,
    additionalPatterns
  };
  
  // Try to update existing block or create new one
  const result = await this.findOneAndUpdate(
    { identifier: identifier.toLowerCase(), blockType },
    blockData,
    { upsert: true, new: true }
  );
  
  return result;
};

module.exports = mongoose.model('BlockedUser', BlockedUserSchema);
