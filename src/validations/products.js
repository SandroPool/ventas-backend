const { body } = require("express-validator");

exports.createProduct = [
    body("name").trim().notEmpty().withMessage("El nombre del producto es requerido"),
    body("price")
        .isFloat({ min: 0.01 })
        .withMessage("El precio debe ser un número positivo"),
    body("unit_type").trim().notEmpty().withMessage("El tipo de unidad es requerido"),
    body("id_category")
        .isInt({ min: 1 })
        .withMessage("La categoría es requerida"),
];

exports.updateProduct = [
    body("name").optional().trim().notEmpty().withMessage("El nombre no puede estar vacío"),
    body("price")
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage("El precio debe ser un número positivo"),
    body("unit_type").optional().trim().notEmpty().withMessage("El tipo de unidad no puede estar vacío"),
    body("id_category")
        .optional()
        .isInt({ min: 1 })
        .withMessage("La categoría no es válida"),
];
