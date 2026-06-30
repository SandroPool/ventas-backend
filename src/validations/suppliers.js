const { body } = require("express-validator");

exports.createSupplier = [
    body("name").trim().notEmpty().withMessage("El nombre y el RUC son obligatorios"),
    body("ruc").trim().notEmpty().withMessage("El nombre y el RUC son obligatorios"),
];

exports.updateSupplier = [
    body("name").optional().trim().notEmpty().withMessage("El nombre no puede estar vacío"),
    body("ruc").optional().trim().notEmpty().withMessage("El RUC no puede estar vacío"),
];
