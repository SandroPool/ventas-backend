const express = require("express");
const router = express.Router();
const { customersController } = require("../controllers");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');
const { createCustomer, updateCustomer, searchByDni } = require("../validations/customers");
const { validate } = require("../middlewares/validate");

router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    customersController.getAll);
router.post("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    createCustomer, validate,
    customersController.create);
router.put("/:id", authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    updateCustomer, validate,
    customersController.update);

router.get("/search", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    searchByDni, validate,
    customersController.searchByDni);

module.exports = router;
