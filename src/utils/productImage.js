const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");

const productImagesDirectory = path.resolve(__dirname, "../../uploads/products");
const productImagesBucket = "products-sales";
const supportedFormats = new Set(["jpeg", "png", "webp", "gif", "avif", "tiff"]);
let supabaseClient;

const getSupabaseClient = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
    }

    if (!supabaseClient) {
        supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    return supabaseClient;
};

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

    let optimizedImage;
    try {
        optimizedImage = await sharp(buffer)
            .rotate()
            .webp({ quality: 80 })
            .toBuffer();
    } catch {
        const error = new Error("El archivo no contiene una imagen válida");
        error.statusCode = 400;
        throw error;
    }

    const filename = `${randomUUID()}.webp`;
    const storage = getSupabaseClient().storage.from(productImagesBucket);
    const { data, error } = await storage.upload(filename, optimizedImage, {
        cacheControl: "31536000",
        contentType: "image/webp",
        upsert: false,
    });

    if (error) {
        throw new Error("No se pudo subir la imagen del producto a Supabase", { cause: error });
    }

    return storage.getPublicUrl(data.path).data.publicUrl;
};

exports.deleteProductImage = async (imageUrl) => {
    if (!imageUrl) return;

    if (imageUrl.startsWith("/uploads/products/")) {
        await fs.unlink(path.join(productImagesDirectory, path.basename(imageUrl)));
        return;
    }

    const projectUrl = process.env.SUPABASE_URL;
    if (!projectUrl) return;

    let parsedImageUrl;
    let parsedProjectUrl;
    try {
        parsedImageUrl = new URL(imageUrl);
        parsedProjectUrl = new URL(projectUrl);
    } catch {
        return;
    }

    const storagePathPrefix = `${parsedProjectUrl.pathname.replace(/\/$/, "")}/storage/v1/object/public/${productImagesBucket}/`;
    if (
        parsedImageUrl.origin !== parsedProjectUrl.origin ||
        !parsedImageUrl.pathname.startsWith(storagePathPrefix)
    ) {
        return;
    }

    const objectPath = decodeURIComponent(parsedImageUrl.pathname.slice(storagePathPrefix.length));
    if (!objectPath) return;

    const { error } = await getSupabaseClient()
        .storage
        .from(productImagesBucket)
        .remove([objectPath]);

    if (error) {
        throw new Error("No se pudo eliminar la imagen anterior del bucket de Supabase", { cause: error });
    }
};
