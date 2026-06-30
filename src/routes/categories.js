const express = require("express");
const router = express.Router();
const { categoryController } = require("../controllers");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');
const { createCategory, updateCategory } = require("../validations/categories");
const { validate } = require("../middlewares/validate");

router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    categoryController.getAll);
router.post("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    createCategory, validate,
    categoryController.create);
router.put("/:id", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    updateCategory, validate,
    categoryController.update);

module.exports = router;
