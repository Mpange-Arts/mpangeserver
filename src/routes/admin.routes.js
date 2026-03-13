const express = require("express");
const router  = express.Router();
const {
  getDashboard, getAllUsers, toggleUserStatus,
  getAllProducts, toggleProductPublish,
  sendPushNotification, getNotifications,
} = require("../controllers/admin.controller");
const { protect }   = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminAuth");

router.use(protect, adminOnly);

router.get("/dashboard",                   getDashboard);
router.get("/users",                       getAllUsers);
router.put("/users/:id/toggle-status",     toggleUserStatus);
router.get("/products",                    getAllProducts);
router.put("/products/:id/toggle-publish", toggleProductPublish);
router.post("/notifications/send",         sendPushNotification);
router.get("/notifications",               getNotifications);

module.exports = router;
