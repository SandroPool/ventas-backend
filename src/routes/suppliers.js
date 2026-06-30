const express = require("express");
const router = express.Router();
const { suppliersController } = require("../controllers");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');
const { createSupplier, updateSupplier } = require("../validations/suppliers");
const { validate } = require("../middlewares/validate");

router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    suppliersController.getAll);
router.post("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    createSupplier, validate,
    suppliersController.create);
router.put("/:id", authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    updateSupplier, validate,
    suppliersController.update);

module.exports = router;
