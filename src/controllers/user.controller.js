const { prisma } = require("../config/db");
const { cloudinary } = require("../config/cloudinary");

// ── Get profile ────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true,
        avatarUrl: true, isActive: true, lastLogin: true, createdAt: true,
      },
    });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Update profile ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
      select: { id: true, name: true, email: true, avatarUrl: true, role: true },
    });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Upload avatar ──────────────────────────────────────────
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Delete old avatar from Cloudinary
    if (user.avatarPubId) {
      await cloudinary.uploader.destroy(user.avatarPubId);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: req.file.path, avatarPubId: req.file.filename },
      select: { avatarUrl: true, avatarPubId: true },
    });

    res.status(200).json({ success: true, avatar: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Save FCM push token ────────────────────────────────────
exports.savePushToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    await prisma.user.update({ where: { id: req.user.id }, data: { fcmToken } });
    res.status(200).json({ success: true, message: "FCM token saved" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
