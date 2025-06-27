const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Admin credentials (in production, store in database)
const ADMIN_CREDENTIALS = {
  email: 'admin@studymaterial.com',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
  name: 'Admin User'
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists
    if (email !== ADMIN_CREDENTIALS.email) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, ADMIN_CREDENTIALS.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      admin: {
        email: ADMIN_CREDENTIALS.email,
        name: ADMIN_CREDENTIALS.name
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          admin: {
            email: ADMIN_CREDENTIALS.email,
            name: ADMIN_CREDENTIALS.name
          }
        });
      }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify admin token
router.get('/verify', (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (!decoded.admin) {
      return res.status(401).json({ message: 'Invalid admin token' });
    }

    res.json({ admin: decoded.admin });
  } catch (error) {
    console.error('Admin token verification error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

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

// Get admin stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const Content = require('../models/Content');
    
    const totalContent = await Content.countDocuments();
    const dsaContent = await Content.countDocuments({ category: 'DSA' });
    const oopContent = await Content.countDocuments({ category: 'OOP' });
    
    // Get unique topics
    const allContent = await Content.find({}, 'subTopic');
    const uniqueTopics = [...new Set(allContent.map(item => item.subTopic))].length;

    res.json({
      totalContent,
      dsaContent,
      oopContent,
      uniqueTopics
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
