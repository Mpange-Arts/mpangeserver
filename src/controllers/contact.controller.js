const { prisma } = require('../config/db');

// POST /api/contact — public, submits inquiry
const submitInquiry = async (req, res) => {
  try {
    const { name, email, phone, projectType, budget, brief } = req.body;
    if (!name || !email || !brief) {
      return res.status(400).json({ message: 'name, email, and brief are required' });
    }
    const inquiry = await prisma.contactInquiry.create({
      data: { name, email, phone, projectType, budget, brief },
    });
    res.status(201).json({ message: 'Inquiry received', inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/contact/admin — admin only
const getInquiries = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = unreadOnly === 'true' ? { isRead: false } : {};

    const [inquiries, total, unreadCount] = await Promise.all([
      prisma.contactInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.contactInquiry.count({ where }),
      prisma.contactInquiry.count({ where: { isRead: false } }),
    ]);

    res.json({ inquiries, total, unreadCount, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/contact/admin/:id/read — mark as read
const markAsRead = async (req, res) => {
  try {
    const inquiry = await prisma.contactInquiry.update({
      where: { id: req.params.id },
      data:  { isRead: true },
    });
    res.json({ message: 'Marked as read', inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/contact/admin/:id
const deleteInquiry = async (req, res) => {
  try {
    await prisma.contactInquiry.delete({ where: { id: req.params.id } });
    res.json({ message: 'Inquiry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submitInquiry, getInquiries, markAsRead, deleteInquiry };