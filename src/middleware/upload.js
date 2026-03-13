const multer = require("multer");
const { imageStorage, avatarStorage, blogStorage, contentStorage } = require("../config/cloudinary");

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
};

const uploadImage   = multer({ storage: imageStorage,   limits: { fileSize: FILE_SIZE_LIMIT }, fileFilter });
const uploadAvatar  = multer({ storage: avatarStorage,  limits: { fileSize: FILE_SIZE_LIMIT }, fileFilter });
const uploadBlog    = multer({ storage: blogStorage,    limits: { fileSize: FILE_SIZE_LIMIT }, fileFilter });
const uploadContent = multer({ storage: contentStorage, limits: { fileSize: FILE_SIZE_LIMIT }, fileFilter });

module.exports = { uploadImage, uploadAvatar, uploadBlog, uploadContent };