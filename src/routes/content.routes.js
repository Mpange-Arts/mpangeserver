const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminAuth");
const { uploadContent, uploadImage } = require("../middleware/upload");
const {
  getSection,
  getAllSections,
  updateSection,
  uploadSectionImage,
  uploadProductImages,
  deleteProductImage,
} = require("../controllers/content.Controller");

// Public
router.get("/", getAllSections);
router.get("/:section", getSection);

// Admin — section text update
router.put("/:section", protect, adminOnly, updateSection);

// Admin — section image upload (hero, contact, etc.)
router.put(
  "/:section/image",
  protect,
  adminOnly,
  uploadContent.single("image"),
  uploadSectionImage,
);

// Admin — product images
router.post(
  "/product/:id/images",
  protect,
  adminOnly,
  uploadImage.array("images", 10),
  uploadProductImages,
);
router.delete(
  "/product/image/:imageId",
  protect,
  adminOnly,
  deleteProductImage,
);

module.exports = router;
