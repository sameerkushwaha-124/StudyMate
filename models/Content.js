const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['OOP', 'DSA'],
    uppercase: true
  },
  subTopic: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  codeExample: {
    type: String,
    default: ''
  },
  images: [{
    filename: String,
    originalName: String,
    path: String, // For backward compatibility
    url: String, // Cloudinary URL
    publicId: String, // Cloudinary public ID for deletion
    cloudinaryData: {
      public_id: String,
      secure_url: String,
      width: Number,
      height: Number,
      format: String,
      resource_type: String,
      bytes: Number,
      created_at: String
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  problemStatement: {
    type: String,
    default: ''
  },
  solution: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better search performance
ContentSchema.index({ category: 1, subTopic: 1 });
ContentSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Content', ContentSchema);
