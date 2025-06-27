const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({
        message: 'User already exists with this email or username'
      });
    }

    // Create new user in pending status
    user = new User({
      username,
      email,
      password,
      role: 'user',
      approvalStatus: 'pending'
    });

    await user.save();

    // Return success message without token (user needs approval)
    res.status(201).json({
      message: 'Registration successful! Your account is pending admin approval. You will be able to login once approved.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        approvalStatus: user.approvalStatus
      }
    });
  } catch (error) {
    console.error(error.message);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: errors.join('. ')
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'User already exists with this email or username'
      });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is approved (skip for admin users)
    if (user.role !== 'admin' && !user.isApproved()) {
      let message = 'Your account is pending admin approval.';
      if (user.approvalStatus === 'rejected') {
        message = user.rejectionReason
          ? `Your account was rejected. Reason: ${user.rejectionReason}`
          : 'Your account was rejected by admin.';
      }
      return res.status(403).json({
        message,
        approvalStatus: user.approvalStatus
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    // If user is not found (deleted), return 401 to force logout
    if (!user) {
      return res.status(401).json({ message: 'User not found. Please login again.' });
    }

    // Check if user is still approved (in case status changed)
    if (user.role !== 'admin' && user.approvalStatus !== 'approved') {
      return res.status(403).json({
        message: 'Account access revoked. Please contact admin.',
        approvalStatus: user.approvalStatus
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/auth/delete-account
// @desc    Delete user's own account
// @access  Private
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be self-deleted' });
    }

    // Store user info for logging before deletion
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    // Delete the user account
    await User.findByIdAndDelete(req.user.id);

    console.log(`User self-deleted account: ${userInfo.email} (${userInfo.username})`);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error in self-delete account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
