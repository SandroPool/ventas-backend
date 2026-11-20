const express = require("express");
const router = express.Router();
const { receptionsController } = require("../controllers");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');
const { createReception, createReceptionBatch, updateReception } = require("../validations/receptions");
const { validate } = require("../middlewares/validate");

router.get("/",
    authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]), receptionsController.getAll);
router.post("/",
    authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    createReception, validate,
    receptionsController.create);
router.post("/batch",
    authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    createReceptionBatch, validate,
    receptionsController.createBatch);
router.put("/:id",
    authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    updateReception, validate,
    receptionsController.update);

module.exports = router;
