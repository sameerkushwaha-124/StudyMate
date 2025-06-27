const express = require('express');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/users/pending
// @desc    Get all pending users for admin approval
// @access  Admin only
router.get('/pending', adminAuth, async (req, res) => {
  try {
    const pendingUsers = await User.find({ 
      approvalStatus: 'pending',
      role: 'user' 
    })
    .select('-password')
    .sort({ createdAt: -1 });

    res.json(pendingUsers);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/all
// @desc    Get all users with their approval status
// @access  Admin only
router.get('/all', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/approve
// @desc    Approve a pending user
// @access  Admin only
router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot modify admin users' });
    }

    if (user.approvalStatus === 'approved') {
      return res.status(400).json({ message: 'User is already approved' });
    }

    await user.approve(req.admin.email);

    res.json({
      message: 'User approved successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        approvalStatus: user.approvalStatus,
        approvedAt: user.approvedAt
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/reject
// @desc    Reject a pending user
// @access  Admin only
router.put('/:id/reject', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot modify admin users' });
    }

    await user.reject(req.admin.email, reason);

    console.log(`User rejected: ${user.email} by admin: ${req.admin.email}. Reason: ${reason || 'No reason provided'}`);

    res.json({
      message: 'User rejected successfully. User cannot login but data remains in database.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        approvalStatus: user.approvalStatus,
        rejectedAt: user.rejectedAt,
        rejectionReason: user.rejectionReason
      }
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user (for rejected users)
// @access  Admin only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
