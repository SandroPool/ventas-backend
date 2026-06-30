const { body } = require("express-validator");

exports.register = [
    body("name").trim().notEmpty().withMessage("Todos los campos son obligatorios"),
    body("email").isEmail().withMessage("Email inválido"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("La contraseña debe tener al menos 6 caracteres"),
    body("role")
        .isIn(["ROOT", "ADMIN", "EMPLOYEE"])
        .withMessage("Rol inválido"),
];

exports.login = [
    body("email").isEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
];
