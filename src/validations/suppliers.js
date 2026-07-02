const { body } = require("express-validator");

exports.createSupplier = [
    body("name").trim().notEmpty().withMessage("El nombre y el RUC son obligatorios")
        .isLength({ max: 100 }).withMessage("El nombre no puede exceder 100 caracteres"),
    body("ruc").trim().notEmpty().withMessage("El nombre y el RUC son obligatorios")
        .isLength({ max: 11 }).withMessage("El RUC no puede exceder 11 caracteres"),
    body("contact").optional().trim()
        .isLength({ max: 100 }).withMessage("El contacto no puede exceder 100 caracteres"),
    body("phone").optional().trim()
        .isLength({ max: 20 }).withMessage("El teléfono no puede exceder 20 caracteres"),
    body("address").optional().trim()
        .isLength({ max: 200 }).withMessage("La dirección no puede exceder 200 caracteres"),
];

exports.updateSupplier = [
    body("name").optional().trim().notEmpty().withMessage("El nombre no puede estar vacío")
        .isLength({ max: 100 }).withMessage("El nombre no puede exceder 100 caracteres"),
    body("ruc").optional().trim().notEmpty().withMessage("El RUC no puede estar vacío")
        .isLength({ max: 11 }).withMessage("El RUC no puede exceder 11 caracteres"),
    body("contact").optional().trim()
        .isLength({ max: 100 }).withMessage("El contacto no puede exceder 100 caracteres"),
    body("phone").optional().trim()
        .isLength({ max: 20 }).withMessage("El teléfono no puede exceder 20 caracteres"),
    body("address").optional().trim()
        .isLength({ max: 200 }).withMessage("La dirección no puede exceder 200 caracteres"),
];
