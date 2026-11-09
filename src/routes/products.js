const express = require("express");
const router = express.Router();
const { productController } = require("../controllers");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');
const { createProduct, updateProduct } = require("../validations/products");
const { validate } = require("../middlewares/validate");
const multer = require("multer");

const uploadProductImage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
            const error = new Error("El archivo debe ser una imagen");
            error.statusCode = 400;
            return callback(error);
        }
        callback(null, true);
    },
}).single("image");

router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    productController.getAll);
router.post("/",
    authMiddleware,
    roleMiddleware([ROOT, ADMIN,]),
    uploadProductImage,
    createProduct, validate,
    productController.create);
router.put("/:id", authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    uploadProductImage,
    updateProduct, validate,
    productController.update);

module.exports = router;
