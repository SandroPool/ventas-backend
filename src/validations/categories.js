const { body } = require("express-validator");

exports.createCategory = [
    body("name").trim().notEmpty().withMessage("El nombre de la categoría es requerido")
        .isLength({ max: 50 }).withMessage("El nombre no puede exceder 50 caracteres"),
];

exports.updateCategory = [
    body("name").trim().notEmpty().withMessage("El nombre de la categoría es requerido")
        .isLength({ max: 50 }).withMessage("El nombre no puede exceder 50 caracteres"),
];
