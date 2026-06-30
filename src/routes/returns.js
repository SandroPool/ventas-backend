const express = require("express");
const router = express.Router();
const { returnsController } = require("../controllers");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');
const { createReturn } = require("../validations/returns");
const { validate } = require("../middlewares/validate");

router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    returnsController.getAll);
router.post("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    createReturn, validate,
    returnsController.create);
router.get("/:id", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    returnsController.getById);
router.get("/sale/:id_sale", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    returnsController.getBySale);

module.exports = router;
