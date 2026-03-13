const express       = require('express');
const router        = express.Router();
const { protect }   = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { uploadBlog } = require('../middleware/upload');
const {
  getPublishedBlogs,
  getBlogBySlug,
  adminGetAllBlogs,
  adminCreateBlog,
  adminUpdateBlog,
  adminDeleteBlog,
  adminTogglePublish,
} = require('../controllers/blog.controller');

// Public
router.get('/',      getPublishedBlogs);
router.get('/:slug', getBlogBySlug);

// Admin
router.get(   '/admin/all',              protect, adminOnly, adminGetAllBlogs);
router.post(  '/admin',                  protect, adminOnly, uploadBlog.single('image'), adminCreateBlog);
router.put(   '/admin/:id',              protect, adminOnly, uploadBlog.single('image'), adminUpdateBlog);
router.delete('/admin/:id',              protect, adminOnly, adminDeleteBlog);
router.put(   '/admin/:id/toggle-publish', protect, adminOnly, adminTogglePublish);

module.exports = router;