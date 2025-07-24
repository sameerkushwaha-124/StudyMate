const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Content = require('../models/Content');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { upload, deleteImage, getOptimizedImageUrl } = require('../config/cloudinary');

const router = express.Router();

// Admin middleware
const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (!decoded.admin) {
      return res.status(401).json({ message: 'Invalid admin token' });
    }

    req.admin = decoded.admin;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// @route   GET /api/content
// @desc    Get all content or filter by category
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { category, subTopic } = req.query;
    let filter = {};
    
    if (category) filter.category = category.toUpperCase();
    if (subTopic) filter.subTopic = subTopic;

    const content = await Content.find(filter)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json(content);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/content/categories
// @desc    Get all categories and their subtopics
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Content.aggregate([
      {
        $group: {
          _id: {
            category: '$category',
            subTopic: '$subTopic'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          subTopics: {
            $push: {
              name: '$_id.subTopic',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json(categories);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/content/:id
// @desc    Get content by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/content
// @desc    Create new content
// @access  Admin Only
router.post('/', adminAuth, upload.array('images', 5), async (req, res) => {
  try {
    const {
      title,
      category,
      subTopic,
      content,
      codeExample,
      problemStatement,
      solution,
      difficulty,
      tags,
      enableCompiler,
      tableQueries,
      tableData
    } = req.body;

    // Process uploaded images from Cloudinary
    const images = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: file.path, // Cloudinary URL
      publicId: file.filename, // Cloudinary public ID
      cloudinaryData: {
        public_id: file.filename,
        secure_url: file.path,
        width: file.width,
        height: file.height,
        format: file.format,
        resource_type: file.resource_type
      }
    })) : [];

    // Create a proper ObjectId for admin user
    const adminId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'); // Fixed admin ObjectId

    // For SQL category, use problemStatement as content if content is empty
    const finalContent = content || (category.toUpperCase() === 'SQL' ? problemStatement || 'SQL Problem' : '');

    const newContent = new Content({
      title,
      category: category.toUpperCase(),
      subTopic,
      content: finalContent,
      codeExample,
      problemStatement,
      solution,
      difficulty,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      enableCompiler: enableCompiler === 'true' || enableCompiler === true,
      images,
      tableQueries: tableQueries || '',
      tableData: tableData ? JSON.parse(tableData) : [],
      createdBy: adminId
    });

    const savedContent = await newContent.save();
    await savedContent.populate('createdBy', 'username');

    res.json(savedContent);
  } catch (error) {
    console.error('Content upload error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      admin: req.admin,
      body: req.body,
      files: req.files ? req.files.length : 0
    });
    res.status(500).json({
      message: 'Failed to upload content',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete content (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Delete associated images from Cloudinary
    if (content.images && content.images.length > 0) {
      for (const image of content.images) {
        try {
          if (image.publicId || image.cloudinaryData?.public_id) {
            const publicId = image.publicId || image.cloudinaryData.public_id;
            await deleteImage(publicId);
            console.log(`Deleted image from Cloudinary: ${publicId}`);
          }
        } catch (error) {
          console.error(`Error deleting image from Cloudinary:`, error);
        }
      }
    }

    await Content.findByIdAndDelete(req.params.id);
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update content (Admin only)
router.put('/:id', adminAuth, upload.array('images', 10), async (req, res) => {
  try {
    console.log('Updating content with ID:', req.params.id);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Files received:', req.files ? req.files.length : 0);

    const { title, category, subTopic, content, codeExample, problemStatement, solution, difficulty, tags, enableCompiler, existingImages } = req.body;

    // Validate required fields
    if (!title || !category || !subTopic) {
      return res.status(400).json({ message: 'Title, category, and subTopic are required' });
    }

    const contentData = await Content.findById(req.params.id);
    if (!contentData) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Handle existing images and deleted images
    let imagesToKeep = [];
    let deletedImages = [];

    if (existingImages) {
      try {
        imagesToKeep = JSON.parse(existingImages);
        console.log('Parsed existing images:', imagesToKeep);
        console.log('Type of first image:', typeof imagesToKeep[0]);
      } catch (e) {
        console.error('Error parsing existing images:', e);
      }
    }

    // Parse deleted images from frontend
    if (req.body.deletedImages) {
      try {
        deletedImages = JSON.parse(req.body.deletedImages);
        console.log('Images marked for deletion:', deletedImages);
      } catch (e) {
        console.error('Error parsing deleted images:', e);
      }
    }

    // Delete explicitly marked images from Cloudinary
    if (deletedImages.length > 0 && contentData.images) {
      for (const deletedImageUrl of deletedImages) {
        // Find the image object in the current content
        const imageToDelete = contentData.images.find(img => {
          const imageUrl = typeof img === 'string' ? img : img.url || img.path;
          return imageUrl === deletedImageUrl;
        });

        if (imageToDelete) {
          const publicId = imageToDelete.publicId || imageToDelete.cloudinaryData?.public_id;
          if (publicId) {
            try {
              await deleteImage(publicId);
              console.log(`✅ Deleted marked image from Cloudinary: ${publicId}`);
            } catch (error) {
              console.error(`❌ Error deleting marked image from Cloudinary:`, error);
            }
          }
        }
      }
    }

    // Also delete images that are no longer in the keep list (fallback for any missed deletions)
    if (contentData.images) {
      for (const image of contentData.images) {
        const imageUrl = typeof image === 'string' ? image : image.url || image.path;
        const publicId = image.publicId || image.cloudinaryData?.public_id;

        if (!imagesToKeep.includes(imageUrl) && !deletedImages.includes(imageUrl) && publicId) {
          try {
            await deleteImage(publicId);
            console.log(`🔄 Fallback deleted image from Cloudinary: ${publicId}`);
          } catch (error) {
            console.error(`❌ Error in fallback deletion:`, error);
          }
        }
      }
    }

    // Handle new uploaded images from Cloudinary
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        url: file.path, // Cloudinary URL
        publicId: file.filename, // Cloudinary public ID
        cloudinaryData: {
          public_id: file.filename,
          secure_url: file.path,
          width: file.width,
          height: file.height,
          format: file.format,
          resource_type: file.resource_type
        }
      }));
    }

    // Combine existing and new images (excluding deleted ones)
    const existingImageObjects = imagesToKeep
      .filter(imageUrl => !deletedImages.includes(imageUrl)) // Exclude deleted images
      .map((imageUrl, index) => {
        console.log(`Processing image ${index}:`, imageUrl, 'Type:', typeof imageUrl);

        // Find the existing image object that matches this URL
        const existingImage = contentData.images.find(img => {
          if (typeof img === 'string') {
            return img === imageUrl;
          }
          // Check multiple possible URL fields
          return img.url === imageUrl ||
                 img.path === imageUrl ||
                 img.cloudinaryData?.secure_url === imageUrl ||
                 `/uploads/${img.filename}` === imageUrl;
        });

        if (existingImage) {
          console.log('✅ Found existing image object:', existingImage);
          return existingImage;
        }

        // If no existing image found, create a simple object with the URL
        console.log('⚠️ Creating new image object for URL:', imageUrl);
        return {
          url: imageUrl,
          path: imageUrl,
          filename: imageUrl.includes('/') ? path.basename(imageUrl) : imageUrl
        };
      })
      .filter(img => img.url || img.path); // Filter out any invalid images

    const allImages = [...existingImageObjects, ...newImages];

    console.log('📊 Final image summary:');
    console.log('- Images to keep:', imagesToKeep.length);
    console.log('- Images deleted:', deletedImages.length);
    console.log('- New images added:', newImages.length);
    console.log('- Final image count:', allImages.length);

    // Update content
    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      {
        title,
        category: category.toUpperCase(),
        subTopic,
        content,
        codeExample,
        problemStatement,
        solution,
        difficulty,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        enableCompiler: enableCompiler === 'true' || enableCompiler === true,
        images: allImages
      },
      { new: true }
    ).populate('createdBy', 'username');

    res.json(updatedContent);
  } catch (error) {
    console.error('Content update error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      admin: req.admin,
      contentId: req.params.id,
      body: req.body,
      files: req.files ? req.files.length : 0
    });
    res.status(500).json({
      message: 'Failed to update content',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
