const { body } = require("express-validator");

exports.createSale = [
    body("id_user").isInt({ min: 1 }).withMessage("El usuario es obligatorio"),
    body("id_customer").isInt({ min: 1 }).withMessage("El cliente es obligatorio"),
    body("payment_method")
        .trim()
        .notEmpty()
        .withMessage("El método de pago es obligatorio"),
    body("operation_number")
        .trim()
        .notEmpty()
        .withMessage("El número de operación es obligatorio"),
    body("details")
        .isArray({ min: 1 })
        .withMessage("Debe incluir al menos un detalle"),
    body("details.*.id_product")
        .isInt({ min: 1 })
        .withMessage("El producto es obligatorio"),
    body("details.*.quantity")
        .isFloat({ min: 0.01 })
        .withMessage("La cantidad debe ser un número positivo"),
    body("details.*.unit_price")
        .isFloat({ min: 0.01 })
        .withMessage("El precio unitario debe ser un número positivo"),
];
