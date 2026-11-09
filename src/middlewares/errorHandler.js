const { logger } = require("../utils");

module.exports = (err, req, res, next) => {
    logger.error(err);
    const statusCode = err.statusCode || (err.code === "LIMIT_FILE_SIZE" ? 413 : 500);
    const message = err.code === "LIMIT_FILE_SIZE"
        ? "La imagen no puede superar los 5 MB"
        : err.message || "Error interno del servidor";
    res.status(statusCode).json({ error: message });
};
