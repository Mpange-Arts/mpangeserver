const express = require("express");
const router  = express.Router();
const { getAll, getOne, create, update, remove } = require("../controllers/product.controller");
const { protect }     = require("../middleware/auth");
const { uploadImage } = require("../middleware/upload");

router.get("/",        getAll);
router.get("/:id",     getOne);
router.post("/",       protect, uploadImage.array("images", 5), create);
router.put("/:id",     protect, update);
router.delete("/:id",  protect, remove);

module.exports = router;
