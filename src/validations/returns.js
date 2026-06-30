const { body } = require("express-validator");

exports.createReturn = [
    body("id_sale").isInt({ min: 1 }).withMessage("La venta es obligatoria"),
    body("id_user").isInt({ min: 1 }).withMessage("El usuario es obligatorio"),
    body("reason").trim().notEmpty().withMessage("El motivo es obligatorio"),
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
