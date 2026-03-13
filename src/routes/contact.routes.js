const express    = require('express');
const router     = express.Router();
const { protect }   = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const {
  submitInquiry,
  getInquiries,
  markAsRead,
  deleteInquiry,
} = require('../controllers/contact.controller');

// Public
router.post('/', submitInquiry);

// Admin
router.get(    '/admin',          protect, adminOnly, getInquiries);
router.put(    '/admin/:id/read', protect, adminOnly, markAsRead);
router.delete( '/admin/:id',      protect, adminOnly, deleteInquiry);

module.exports = router;