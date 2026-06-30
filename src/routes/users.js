const express = require("express");
const router = express.Router();
const { usersController } = require("../controllers");
const { authMiddleware, roleMiddleware } = require("../middlewares/auth");
const { ROOT, ADMIN, EMPLOYEE } = require('../configs/constants');
const { register, login } = require("../validations/users");
const { validate } = require("../middlewares/validate");

router.post("/register", register, validate, usersController.register);

router.post("/login", login, validate, usersController.login);
router.post("/refresh-token", usersController.refreshToken);
router.post("/logout", authMiddleware, usersController.logout);

router.get("/", authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    usersController.getAll);
router.put("/:id",
    authMiddleware,
    roleMiddleware([ROOT, ADMIN]),
    usersController.update);
router.get("/profile",
    authMiddleware,
    roleMiddleware([ROOT, ADMIN, EMPLOYEE]),
    usersController.getProfile);

module.exports = router;
