const { body } = require("express-validator");

exports.createProduct = [
    body("name").trim().notEmpty().withMessage("El nombre del producto es requerido")
        .isLength({ max: 100 }).withMessage("El nombre no puede exceder 100 caracteres"),
    body("description").optional().trim()
        .isLength({ max: 500 }).withMessage("La descripción no puede exceder 500 caracteres"),
    body("price")
        .isFloat({ min: 0.01 })
        .withMessage("El precio debe ser un número positivo"),
    body("unit_type").trim().notEmpty().withMessage("El tipo de unidad es requerido")
        .isLength({ max: 30 }).withMessage("La unidad no puede exceder 30 caracteres"),
    body("id_category")
        .isInt({ min: 1 })
        .withMessage("La categoría es requerida"),
];

exports.updateProduct = [
    body("name").optional().trim().notEmpty().withMessage("El nombre no puede estar vacío")
        .isLength({ max: 100 }).withMessage("El nombre no puede exceder 100 caracteres"),
    body("description").optional().trim()
        .isLength({ max: 500 }).withMessage("La descripción no puede exceder 500 caracteres"),
    body("price")
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage("El precio debe ser un número positivo"),
    body("unit_type").optional().trim().notEmpty().withMessage("El tipo de unidad no puede estar vacío")
        .isLength({ max: 30 }).withMessage("La unidad no puede exceder 30 caracteres"),
    body("id_category")
        .optional()
        .isInt({ min: 1 })
        .withMessage("La categoría no es válida"),
];
