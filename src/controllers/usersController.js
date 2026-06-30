const prisma = require("../configs/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const SECRET_KEY = process.env.JWT_SECRET;
const { asyncHandler, parsePagination, paginatedResponse } = require("../utils");

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password)) || !user.status) {
        return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const accessToken = jwt.sign({ id: user.id_user, role: user.role }, SECRET_KEY, { expiresIn: "15m" });
    const refreshToken = uuidv4();
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.users.update({
        where: { id_user: user.id_user },
        data: { refreshToken, refreshTokenExpiresAt }
    });

    res.json({ accessToken, refreshToken });
});

exports.refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ error: "No se proporcionó un refreshToken" });
    }

    const user = await prisma.users.findUnique({ where: { refreshToken } });

    if (!user) {
        return res.status(403).json({ error: "Refresh token inválido" });
    }

    if (!user.refreshTokenExpiresAt || new Date() > user.refreshTokenExpiresAt) {
        return res.status(403).json({ error: "Refresh token expirado" });
    }

    const newAccessToken = jwt.sign({ id: user.id_user, role: user.role }, SECRET_KEY, { expiresIn: "24h" });
    const newRefreshToken = uuidv4();
    const newRefreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.users.update({
        where: { id_user: user.id_user },
        data: { refreshToken: newRefreshToken, refreshTokenExpiresAt: newRefreshTokenExpiresAt }
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

exports.logout = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    await prisma.users.update({
        where: { id_user: userId },
        data: { refreshToken: null, refreshTokenExpiresAt: null }
    });

    res.json({ message: "Sesión cerrada con éxito" });
});

exports.register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ error: "El email ya está en uso. Elige otro." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.users.create({
        data: { name, email, password: hashedPassword, role }
    });
    res.status(201).json({ message: "Usuario registrado con éxito" });
});

exports.getProfile = asyncHandler(async (req, res) => {
    const user = await prisma.users.findUnique({
        where: { id_user: req.user.id },
        select: { id_user: true, name: true, email: true, role: true, status: true, createdAt: true }
    });
    if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(user);
});

exports.getAll = asyncHandler(async (req, res) => {
    const { searchTerm = "" } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const where = searchTerm
        ? {
            OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { email: { contains: searchTerm, mode: "insensitive" } }
            ]
        }
        : {};

    const totalUsers = await prisma.users.count({ where });

    const users = await prisma.users.findMany({
        where,
        ...(searchTerm ? {} : { skip, take: limit }),
        select: {
            id_user: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true
        }
    });

    res.json(paginatedResponse(users, totalUsers, page, limit));
});

exports.update = asyncHandler(async (req, res) => {
    const { name, email, password, role, status } = req.body;
    const updatedData = {};
    if (name) updatedData.name = name;
    if (email) updatedData.email = email;
    if (role) updatedData.role = role;
    if (status !== undefined) updatedData.status = status;
    if (password && password.trim() !== "") {
        updatedData.password = await bcrypt.hash(password, 10);
    }
    const updatedUser = await prisma.users.update({
        where: { id_user: parseInt(req.params.id) },
        data: updatedData,
        select: { id_user: true, name: true, email: true, role: true, status: true, updatedAt: true }
    });
    res.json(updatedUser);
});
