const { body } = require("express-validator");

exports.createReception = [
    body("id_product").isInt({ min: 1 }).withMessage("El producto es requerido"),
    body("quantity")
        .isFloat({ min: 0.01 })
        .withMessage("La cantidad debe ser un número positivo"),
    body("purchase_price")
        .isFloat({ min: 0.01 })
        .withMessage("El precio de compra debe ser un número positivo"),
    body("id_supplier").isInt({ min: 1 }).withMessage("El proveedor es requerido"),
    body("id_user").isInt({ min: 1 }).withMessage("El usuario es requerido"),
    body("date")
        .optional({ values: "falsy" })
        .isISO8601()
        .withMessage("Fecha inválida"),
];

exports.updateReception = [
    body("id_product")
        .optional()
        .isInt({ min: 1 })
        .withMessage("El producto no es válido"),
    body("quantity")
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage("La cantidad debe ser un número positivo"),
    body("purchase_price")
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage("El precio de compra debe ser un número positivo"),
    body("id_supplier")
        .optional()
        .isInt({ min: 1 })
        .withMessage("El proveedor no es válido"),
    body("id_user")
        .optional()
        .isInt({ min: 1 })
        .withMessage("El usuario no es válido"),
];
