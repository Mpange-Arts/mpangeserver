const express = require("express");
const router  = express.Router();
const { getProfile, updateProfile, uploadAvatar, savePushToken } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth");
const { uploadAvatar: avatarMiddleware } = require("../middleware/upload");

router.use(protect);
router.get("/profile",    getProfile);
router.put("/profile",    updateProfile);
router.put("/avatar",     avatarMiddleware.single("avatar"), uploadAvatar);
router.put("/push-token", savePushToken);

module.exports = router;
