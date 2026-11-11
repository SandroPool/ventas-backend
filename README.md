# sales-backend

## 🛠️ Setup inicial

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear `.env` con tu conexión de base de datos (DB PostgreSQL):
   ```env
   DATABASE_URL="postgresql://user:password@host:port/dbname"
   JWT_SECRET="un-secreto-super-seguro"
   ```
3. Configurar el almacenamiento de imágenes de productos en Supabase:
   ```env
   SUPABASE_URL="https://tu-proyecto.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="tu-clave-de-servicio"
   ```
   Crea un bucket público llamado `productos` en Supabase Storage. La clave de servicio
   solo debe existir en el `.env` del backend y nunca exponerse en el frontend.
4. Ejecutar migraciones (en entorno de desarrollo):
   ```bash
   npm run prisma:deploy
   ```

## 🌱 Seed inicial de roles / usuarios

El proyecto usa un `enum Role` en Prisma:
- `ROOT`
- `ADMIN`
- `EMPLOYEE`

Se crean 3 usuarios de prueba (ROOT, ADMIN, EMPLOYEE) y los datos iniciales. Para ejecutarlos:

```bash
npm run seed
```

Usuarios iniciales:
- `root@ventas.com` / `RootPass123!` (ROLE=ROOT)
- `admin@ventas.com` / `AdminPass123!` (ROLE=ADMIN)
- `empleado@ventas.com` / `EmployeePass123!` (ROLE=EMPLOYEE)

> Importante: cambiar estas credenciales en producción o antes de desplegar.

## ▶️ Ejecución local

```bash
npm run dev
```

## 🔐 Autenticación

- Login: /users/login
- Refresh: /users/refresh-token
- Logout: /users/logout

## 📦 Notas

- El seed impide duplicados revisando el email antes de crear.
- Si quieres, añade `npm run seed -- --force` para forzar limpieza antes de crear (no implementado aquí).
