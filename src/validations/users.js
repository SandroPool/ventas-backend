const { body } = require("express-validator");

exports.register = [
    body("name").trim().notEmpty().withMessage("Todos los campos son obligatorios")
        .isLength({ max: 100 }).withMessage("El nombre no puede exceder 100 caracteres"),
    body("email").isEmail().withMessage("Email inválido")
        .isLength({ max: 100 }).withMessage("El email no puede exceder 100 caracteres"),
    body("password")
        .isLength({ min: 6, max: 100 })
        .withMessage("La contraseña debe tener entre 6 y 100 caracteres"),
    body("role")
        .isIn(["ROOT", "ADMIN", "EMPLOYEE"])
        .withMessage("Rol inválido"),
];

exports.login = [
    body("email").isEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
];
