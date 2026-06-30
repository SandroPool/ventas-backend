const express = require("express");
const router = express.Router();
const { installmentsController } = require("../controllers");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');
const { createInstallments } = require("../validations/installments");
const { validate } = require("../middlewares/validate");

router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    installmentsController.getAll);
router.post("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    createInstallments, validate,
    installmentsController.create);
router.put("/:id/pay", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    installmentsController.pay);
router.get("/sale/:id_sale", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    installmentsController.getBySale);

module.exports = router;
