const { body } = require("express-validator");

exports.createInstallments = [
    body("id_sale").isInt({ min: 1 }).withMessage("La venta es obligatoria"),
    body("installments")
        .isArray({ min: 1 })
        .withMessage("Debe incluir al menos una cuota"),
    body("installments.*.amount")
        .isFloat({ min: 0.01 })
        .withMessage("El monto de cada cuota debe ser un número positivo"),
    body("installments.*.due_date")
        .isISO8601()
        .withMessage("La fecha de vencimiento es obligatoria y debe ser una fecha válida"),
];
