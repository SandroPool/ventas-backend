const express = require("express");
const router = express.Router();
const { dashboardController } = require("../controllers");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');

// Rutas protegidas para dashboard
router.get("/sales-summary", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getSalesSummary);
router.get("/payment-methods", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getPaymentMethods);
router.get("/top-products", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getTopProducts);
router.get("/top-users", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getTopUsers);

router.get("/top-customers", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getTopCustomers);

router.get("/sales-trend", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getSalesTrend);
router.get("/low-stock", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getLowStock);
router.get("/sales-by-category", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getSalesByCategory);
router.get("/returns-rate", authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    dashboardController.getReturnsRate);

module.exports = router;
