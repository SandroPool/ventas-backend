const { body, query } = require("express-validator");

exports.createCustomer = [
    body("name").trim().notEmpty().withMessage("Nombre y apellido son obligatorios")
        .isLength({ max: 50 }).withMessage("El nombre no puede exceder 50 caracteres"),
    body("first_surname").trim().notEmpty().withMessage("Nombre y apellido son obligatorios")
        .isLength({ max: 50 }).withMessage("El apellido no puede exceder 50 caracteres"),
    body("second_surname").trim().notEmpty().withMessage("Nombre y apellido son obligatorios")
        .isLength({ max: 50 }).withMessage("El apellido no puede exceder 50 caracteres"),
    body("dni")
        .trim()
        .matches(/^\d{8}$/)
        .withMessage("El DNI debe tener exactamente 8 dígitos"),
];

exports.updateCustomer = [
    body().custom((value, { req }) => {
        const { name, first_surname, second_surname, dni } = req.body;
        if (!name && !first_surname && !second_surname && !dni) {
            throw new Error("Debe proporcionar al menos un campo para actualizar");
        }
        return true;
    }),
];

exports.searchByDni = [
    query("dni")
        .trim()
        .matches(/^\d{8}$/)
        .withMessage("El DNI debe tener exactamente 8 dígitos"),
];
