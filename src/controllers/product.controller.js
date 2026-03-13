const { prisma } = require("../config/db");
const { cloudinary } = require("../config/cloudinary");

// ── Get all (public, paginated) ────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, featured } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { isPublished: true };
    if (category) where.category = category;
    if (featured) where.isFeatured = true;
    if (search)   where.OR = [
      { title:       { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          images: true,
          createdBy: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
    ]);

    res.status(200).json({
      success: true, total, page: Number(page),
      pages: Math.ceil(total / Number(limit)), products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get single ─────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        images: true,
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Increment views
    await prisma.product.update({ where: { id: product.id }, data: { views: { increment: 1 } } });

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Create ─────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { title, description, price, category, tags } = req.body;
    const images = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));

    const product = await prisma.product.create({
      data: {
        title, description,
        price:    parseFloat(price) || 0,
        category,
        tags:     tags ? JSON.parse(tags) : [],
        userId:   req.user.id,
        images:   { create: images },
      },
      include: { images: true },
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Update ─────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { title, description, price, category, tags, isPublished, isFeatured } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(title       && { title }),
        ...(description && { description }),
        ...(price       !== undefined && { price: parseFloat(price) }),
        ...(category    && { category }),
        ...(tags        && { tags: JSON.parse(tags) }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
        ...(isFeatured  !== undefined && { isFeatured:  Boolean(isFeatured) }),
      },
      include: { images: true },
    });

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Delete ─────────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Delete images from Cloudinary
    for (const img of product.images) {
      await cloudinary.uploader.destroy(img.publicId);
    }

    await prisma.product.delete({ where: { id: req.params.id } });

    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
