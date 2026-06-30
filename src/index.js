const express = require("express");
const cors = require("cors");
const morgan = require('morgan');
const { logger } = require("./utils");
const errorHandler = require("./middlewares/errorHandler");

const stream = { write: (message) => logger.http(message.trim()) };
const {
    productRoutes, salesRoutes, customersRoutes,
    usersRoutes, stockRoutes, categoryRoutes,
    suppliersRoutes, receptionsRoutes, dashboardRoutes,
    returnsRoutes, installmentsRoutes
} = require('./routes/index');
const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173'];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev', { stream }));
app.use(express.json());
// Usar rutas
const api = 'api';

app.use(`/${api}/products`, productRoutes);
app.use(`/${api}/users`, usersRoutes);
app.use(`/${api}/categories`, categoryRoutes);
app.use(`/${api}/suppliers`, suppliersRoutes);
app.use(`/${api}/receptions`, receptionsRoutes);
app.use(`/${api}/customers`, customersRoutes);
app.use(`/${api}/sales`, salesRoutes);
app.use(`/${api}/stock`, stockRoutes);
app.use(`/${api}/dashboard`, dashboardRoutes);
app.use(`/${api}/returns`, returnsRoutes);
app.use(`/${api}/installments`, installmentsRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Servidor corriendo en http://localhost:${PORT}`);
});
