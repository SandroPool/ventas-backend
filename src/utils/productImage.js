const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const sharp = require("sharp");

const productImagesDirectory = path.resolve(__dirname, "../../uploads/products");
const supportedFormats = new Set(["jpeg", "png", "webp", "gif", "avif", "tiff"]);

exports.saveProductImage = async (buffer) => {
    let metadata;
    try {
        metadata = await sharp(buffer).metadata();
    } catch {
        const error = new Error("El archivo no contiene una imagen válida");
        error.statusCode = 400;
        throw error;
    }

    if (!supportedFormats.has(metadata.format)) {
        const error = new Error("El formato de imagen no es compatible");
        error.statusCode = 400;
        throw error;
    }

    await fs.mkdir(productImagesDirectory, { recursive: true });

    const filename = `${randomUUID()}.webp`;
    await sharp(buffer)
        .rotate()
        .webp({ quality: 80 })
        .toFile(path.join(productImagesDirectory, filename));

    return `/uploads/products/${filename}`;
};

exports.deleteProductImage = async (imagePath) => {
    if (!imagePath?.startsWith("/uploads/products/")) return;
    await fs.unlink(path.join(productImagesDirectory, path.basename(imagePath)));
};
