const { body } = require("express-validator");

exports.createCategory = [
    body("name").trim().notEmpty().withMessage("El nombre de la categoría es requerido"),
];

exports.updateCategory = [
    body("name").trim().notEmpty().withMessage("El nombre de la categoría es requerido"),
];
