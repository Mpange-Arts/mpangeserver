const { prisma }    = require('../config/db');
const { cloudinary } = require('../config/cloudinary');
const slugify        = require('slugify');

// ── Public ────────────────────────────────────────────────────

exports.getPublishedBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, tag } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const where = {
      isPublished: true,
      ...(tag ? { tags: { has: tag } } : {}),
    };
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take: Number(limit),
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      }),
      prisma.blog.count({ where }),
    ]);
    res.json({ blogs, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await prisma.blog.findUnique({
      where:   { slug: req.params.slug },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
    if (!blog || !blog.isPublished) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin ─────────────────────────────────────────────────────

exports.adminGetAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        orderBy: { createdAt: 'desc' },
        skip, take: Number(limit),
        include: { author: { select: { id: true, name: true } } },
      }),
      prisma.blog.count(),
    ]);
    res.json({ blogs, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminCreateBlog = async (req, res) => {
  try {
    const { title, excerpt, body, tags, isPublished } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: 'title and body are required' });
    }

    const slug = slugify(title, { lower: true, strict: true });

    // Image uploaded via multer → cloudinary
    const imageUrl   = req.file?.path        || '';
    const imagePubId = req.file?.filename    || '';

    const blog = await prisma.blog.create({
      data: {
        title, slug, excerpt, body,
        imageUrl, imagePubId,
        tags:        tags ? JSON.parse(tags) : [],
        isPublished: isPublished === 'true' || isPublished === true,
        authorId:    req.user.id,
      },
    });
    res.status(201).json({ message: 'Blog created', blog });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminUpdateBlog = async (req, res) => {
  try {
    const existing = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Blog not found' });

    const { title, excerpt, body, tags, isPublished } = req.body;

    let imageUrl   = existing.imageUrl;
    let imagePubId = existing.imagePubId;

    // New image uploaded — delete old one first
    if (req.file) {
      if (existing.imagePubId) {
        await cloudinary.uploader.destroy(existing.imagePubId);
      }
      imageUrl   = req.file.path;
      imagePubId = req.file.filename;
    }

    const slug = title ? slugify(title, { lower: true, strict: true }) : existing.slug;

    const blog = await prisma.blog.update({
      where: { id: req.params.id },
      data: {
        title:       title       ?? existing.title,
        slug,
        excerpt:     excerpt     ?? existing.excerpt,
        body:        body        ?? existing.body,
        tags:        tags        ? JSON.parse(tags) : existing.tags,
        isPublished: isPublished !== undefined
          ? (isPublished === 'true' || isPublished === true)
          : existing.isPublished,
        imageUrl,
        imagePubId,
      },
    });
    res.json({ message: 'Blog updated', blog });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminDeleteBlog = async (req, res) => {
  try {
    const existing = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Blog not found' });

    // Delete image from cloudinary
    if (existing.imagePubId) {
      await cloudinary.uploader.destroy(existing.imagePubId);
    }

    await prisma.blog.delete({ where: { id: req.params.id } });
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminTogglePublish = async (req, res) => {
  try {
    const existing = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Blog not found' });

    const blog = await prisma.blog.update({
      where: { id: req.params.id },
      data:  { isPublished: !existing.isPublished },
    });
    res.json({ message: `Blog ${blog.isPublished ? 'published' : 'unpublished'}`, blog });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};