const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const initialUsers = [
    { name: "Root User", email: "root@ventas.com", password: "RootPass123!", role: "ROOT", status: true },
    { name: "Admin User", email: "admin@ventas.com", password: "AdminPass123!", role: "ADMIN", status: true },
    { name: "Employee User", email: "empleado@ventas.com", password: "EmployeePass123!", role: "EMPLOYEE", status: true },
  ];

  for (const userData of initialUsers) {
    let user = await prisma.users.findUnique({ where: { email: userData.email } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      user = await prisma.users.create({ data: { ...userData, password: hashedPassword } });
      console.log(`Usuario creado: ${userData.email} (${userData.role})`);
    } else {
      console.log(`Usuario existente ignorado: ${userData.email}`);
    }
  }

  console.log("╔═══════════════════════════════════╗");
  console.log("║    SEED USUARIOS COMPLETADO      ║");
  console.log("╚═══════════════════════════════════╝");
  console.log(`Usuarios procesados: ${initialUsers.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
