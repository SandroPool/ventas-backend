const express = require("express");
const router = express.Router();
const { productController } = require("../controllers");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');
const { createProduct, updateProduct } = require("../validations/products");
const { validate } = require("../middlewares/validate");

router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    productController.getAll);
router.post("/",
    authMiddleware,
    roleMiddleware([ROOT, ADMIN,]),
    createProduct, validate,
    productController.create);
router.put("/:id", authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    updateProduct, validate,
    productController.update);

module.exports = router;
