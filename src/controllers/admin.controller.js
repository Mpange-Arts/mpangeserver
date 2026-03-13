const { prisma } = require("../config/db");
const admin = require("../config/firebase");

// ── Dashboard Analytics ─────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalProducts, activeUsers, publishedProducts, recentUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.product.count({ where: { isPublished: true } }),
        prisma.user.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

    // Build chart data from recentUsers
    const chartMap = {};
    recentUsers.forEach((u) => {
      const date = u.createdAt.toISOString().split('T')[0];
      chartMap[date] = (chartMap[date] || 0) + 1;
    });
    const newUsersChart = Object.entries(chartMap).map(([date, count]) => ({ date, count }));

    res.status(200).json({
      success: true,
      stats: { totalUsers, totalProducts, activeUsers, publishedProducts },
      charts: { newUsersChart },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get all users ───────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        skip, take: Number(limit),
        select: {
          id: true, name: true, email: true, role: true,
          isActive: true, avatarUrl: true, lastLogin: true, createdAt: true,
        },
      }),
    ]);
    res.status(200).json({ success: true, total, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Toggle user active status ───────────────────────────────
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data:  { isActive: !user.isActive },
    });

    res.status(200).json({
      success: true,
      message: `User ${updated.isActive ? "activated" : "deactivated"}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get all products (incl. unpublished) ───────────────────
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [total, products] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        skip, take: Number(limit),
        include: {
          images: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);
    res.status(200).json({ success: true, total, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Toggle product publish ──────────────────────────────────
exports.toggleProductPublish = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data:  { isPublished: !product.isPublished },
    });

    res.status(200).json({ success: true, isPublished: updated.isPublished });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Send Push Notification via FCM ─────────────────────────
exports.sendPushNotification = async (req, res) => {
  try {
    const { title, body, audience, recipientIds, data = {} } = req.body;

    let tokens = [];
    if (audience === "ALL") {
      const users = await prisma.user.findMany({
        where:  { fcmToken: { not: "" } },
        select: { fcmToken: true },
      });
      tokens = users.map((u) => u.fcmToken).filter(Boolean);
    } else {
      const users = await prisma.user.findMany({
        where:  { id: { in: recipientIds }, fcmToken: { not: "" } },
        select: { fcmToken: true },
      });
      tokens = users.map((u) => u.fcmToken).filter(Boolean);
    }

    const notification = await prisma.notification.create({
      data: {
        title, body,
        audience:     audience || "ALL",
        recipientIds: recipientIds || [],
        data,
        sentById:     req.user.id,
        status:       "PENDING",
      },
    });

    let successCount = 0;
    const chunkSize  = 500;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk   = tokens.slice(i, i + chunkSize);
      const message = {
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        tokens: chunk,
      };
      const response = await admin.messaging().sendEachForMulticast(message);
      successCount  += response.successCount;
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data:  { status: "SENT", sentAt: new Date() },
    });

    res.status(200).json({ success: true, sent: successCount, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get notification history ────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { sentBy: { select: { id: true, name: true } } },
    });
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};