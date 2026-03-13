const { prisma }     = require("../config/db");
const { cloudinary } = require("../config/cloudinary");

// ── Get a single section (public) ─────────────────────────
exports.getSection = async (req, res) => {
  try {
    const { section } = req.params;
    const content = await prisma.siteContent.findUnique({ where: { section } });
    if (!content) {
      return res.status(404).json({ success: false, message: `Section '${section}' not found` });
    }
    res.status(200).json({ success: true, section: content.section, data: content.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get all sections (public) ──────────────────────────────
exports.getAllSections = async (req, res) => {
  try {
    const sections = await prisma.siteContent.findMany();
    const result = sections.reduce((acc, s) => {
      acc[s.section] = s.data;
      return acc;
    }, {});
    res.status(200).json({ success: true, content: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Update a section (admin only) ─────────────────────────
exports.updateSection = async (req, res) => {
  try {
    const { section } = req.params;
    const { data }    = req.body;

    const content = await prisma.siteContent.upsert({
      where:  { section },
      update: { data },
      create: { section, data },
    });

    res.status(200).json({ success: true, section: content.section, data: content.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Upload image for any section (admin only) ─────────────
// PUT /api/content/:section/image
// Supports: hero, contact — any section that has imageUrl + imagePubId
exports.uploadSectionImage = async (req, res) => {
  try {
    const { section } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Delete old image from Cloudinary if it exists
    const existing = await prisma.siteContent.findUnique({ where: { section } });
    const oldPubId = existing?.data?.imagePubId || existing?.data?.imagePublicId;
    if (oldPubId) {
      await cloudinary.uploader.destroy(oldPubId).catch(() => {});
    }

    const newData = {
      ...(existing?.data || {}),
      imageUrl:   req.file.path,
      imagePubId: req.file.filename,
    };

    const content = await prisma.siteContent.upsert({
      where:  { section },
      update: { data: newData },
      create: { section, data: newData },
    });

    res.status(200).json({ success: true, data: content.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Upload product images (admin only) ────────────────────
// POST /api/content/product/:id/images
exports.uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const images = await Promise.all(
      req.files.map((file) =>
        prisma.productImage.create({
          data: {
            url:       file.path,
            publicId:  file.filename,
            productId: id,
          },
        })
      )
    );

    res.status(201).json({ success: true, images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Delete a product image (admin only) ───────────────────
// DELETE /api/content/product/image/:imageId
exports.deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    // Delete from Cloudinary
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId).catch(() => {});
    }

    await prisma.productImage.delete({ where: { id: imageId } });

    res.status(200).json({ success: true, message: "Image deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};