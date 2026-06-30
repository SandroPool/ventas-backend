const prisma = require("../configs/prisma");
const { asyncHandler } = require("../utils");

exports.getAll = asyncHandler(async (req, res) => {
    const categories = await prisma.categories.findMany();
    res.json(categories);
});

exports.create = asyncHandler(async (req, res) => {
    const { name } = req.body;

    const existingCategory = await prisma.categories.findUnique({
        where: { name: name.trim() },
    });

    if (existingCategory) {
        return res.status(400).json({ error: "La categoría ya existe" });
    }

    const newCategory = await prisma.categories.create({
        data: { name: name.trim() },
    });

    res.status(201).json(newCategory);
});

exports.update = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const { id } = req.params;
    const categoryId = parseInt(id, 10);

    const category = await prisma.categories.findUnique({
        where: { id_category: categoryId }
    });

    if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
    }

    const updatedCategory = await prisma.categories.update({
        where: { id_category: categoryId },
        data: { name: name.trim() },
    });

    res.json(updatedCategory);
});
