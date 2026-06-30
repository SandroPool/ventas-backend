const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.users.findUnique({ where: { email: "admin@example.com" } });
  const employeeUser = await prisma.users.findUnique({ where: { email: "employee@example.com" } });

  // ─── CATEGORÍAS ─────────────────────────────────────────────
  const categoryData = [
    { name: "Bebidas" },
    { name: "Lácteos" },
    { name: "Abarrotes" },
    { name: "Limpieza" },
    { name: "Snacks" },
  ];

  const categories = [];
  for (const cat of categoryData) {
    let category = await prisma.categories.findUnique({ where: { name: cat.name } });
    if (!category) {
      category = await prisma.categories.create({ data: cat });
      console.log(`Categoría creada: ${cat.name}`);
    }
    categories.push(category);
  }

  // ─── PRODUCTOS ──────────────────────────────────────────────
  const productData = [
    { name: "Coca-Cola 1.5L", description: "Gaseosa Coca-Cola sabor original 1.5 litros", sku: "COCA15", price: 7.50, unit_type: "UNIDAD", id_category: categories[0].id_category },
    { name: "Inka Kola 1.5L", description: "Gaseosa Inka Kola sabor original 1.5 litros", sku: "INKA15", price: 7.00, unit_type: "UNIDAD", id_category: categories[0].id_category },
    { name: "Agua San Luis 625ml", description: "Agua mineral San Luis 625 ml", sku: "AGUASL", price: 2.50, unit_type: "UNIDAD", id_category: categories[0].id_category },
    { name: "Leche Gloria 1L", description: "Leche evaporada Gloria 1 litro", sku: "LECHEG", price: 4.80, unit_type: "UNIDAD", id_category: categories[1].id_category },
    { name: "Yogurt Laive natural", description: "Yogurt natural Laive 1 litro", sku: "YOGLAI", price: 6.50, unit_type: "UNIDAD", id_category: categories[1].id_category },
    { name: "Queso Mantecoso", description: "Queso mantecoso x 500g", sku: "QUESOM", price: 12.00, unit_type: "KILO", id_category: categories[1].id_category },
    { name: "Arroz Costeño 5kg", description: "Arroz extra Costeño 5 kilogramos", sku: "ARROZ5", price: 18.50, unit_type: "KILO", id_category: categories[2].id_category },
    { name: "Fideos Don Vittorio", description: "Fideos Don Vittorio spaghetti 500g", sku: "FIDEOV", price: 3.20, unit_type: "UNIDAD", id_category: categories[2].id_category },
    { name: "Azúcar Rubia", description: "Azúcar rubia doméstica 1kg", sku: "AZUCAR", price: 4.00, unit_type: "KILO", id_category: categories[2].id_category },
    { name: "Detergente Ace 1kg", description: "Detergente Ace perfume original 1kg", sku: "DETERA", price: 9.90, unit_type: "UNIDAD", id_category: categories[3].id_category },
    { name: "Lejía Clorox 1L", description: "Lejía Clorox 1 litro", sku: "LEJIAC", price: 5.50, unit_type: "UNIDAD", id_category: categories[3].id_category },
    { name: "Papas Lays 120g", description: "Papas fritas Lays clásico 120g", sku: "PAPLAY", price: 4.50, unit_type: "UNIDAD", id_category: categories[4].id_category },
    { name: "Galletas Oreo 96g", description: "Galletas Oreo 96 gramos", sku: "OREO96", price: 3.80, unit_type: "UNIDAD", id_category: categories[4].id_category },
    { name: "Chifles plátano 200g", description: "Chifles de plátano verde 200g", sku: "CHIFLE", price: 5.00, unit_type: "UNIDAD", id_category: categories[4].id_category },
  ];

  const products = [];
  for (const prod of productData) {
    let product = await prisma.products.findUnique({ where: { sku: prod.sku } });
    if (!product) {
      product = await prisma.products.create({ data: prod });
      console.log(`Producto creado: ${prod.name}`);
    }
    products.push(product);
  }

  // ─── PROVEEDORES ────────────────────────────────────────────
  const supplierData = [
    { name: "Distribuidora San Miguel", ruc: "20100010001", contact: "José Martínez", phone: "999111000", address: "Av. Argentina 1234, Lima" },
    { name: "Corporación Lindley", ruc: "20100020002", contact: "María López", phone: "999222000", address: "Av. Colonial 567, Lima" },
    { name: "Alicorp S.A.", ruc: "20100030003", contact: "Carlos Pérez", phone: "999333000", address: "Av. Elmer Faucett 789, Callao" },
    { name: "Gloria S.A.", ruc: "20100040004", contact: "Ana Castillo", phone: "999444000", address: "Jr. Puno 456, Arequipa" },
    { name: "Molitalia S.A.", ruc: "20100050005", contact: "Pedro Sánchez", phone: "999555000", address: "Av. Industria 321, Lima" },
  ];

  const suppliers = [];
  for (const sup of supplierData) {
    let supplier = await prisma.suppliers.findUnique({ where: { ruc: sup.ruc } });
    if (!supplier) {
      supplier = await prisma.suppliers.create({ data: sup });
      console.log(`Proveedor creado: ${sup.name}`);
    }
    suppliers.push(supplier);
  }

  // ─── CLIENTES ───────────────────────────────────────────────
  const customerData = [
    { name: "Juan", first_surname: "Pérez", second_surname: "García", dni: "12345678" },
    { name: "María", first_surname: "López", second_surname: "Fernández", dni: "23456789" },
    { name: "Carlos", first_surname: "Ramírez", second_surname: "Torres", dni: "34567890" },
    { name: "Ana", first_surname: "Castillo", second_surname: "Mendoza", dni: "45678901" },
    { name: "Pedro", first_surname: "Sánchez", second_surname: "Paredes", dni: "56789012" },
    { name: "Rosa", first_surname: "Huamán", second_surname: "Quispe", dni: "67890123" },
  ];

  const customers = [];
  for (const cust of customerData) {
    let customer = await prisma.customers.findUnique({ where: { dni: cust.dni } });
    if (!customer) {
      customer = await prisma.customers.create({ data: cust });
      console.log(`Cliente creado: ${cust.name} ${cust.first_surname}`);
    }
    customers.push(customer);
  }

  // ─── RECEPCIONES (INGRESO DE STOCK) ─────────────────────────
  const receptionDate = new Date("2026-06-15");
  const receptionData = [
    { id_product: products[0].id_product, quantity: 50, purchase_price: 5.00, id_supplier: suppliers[0].id_supplier, id_user: adminUser.id_user, date: receptionDate },
    { id_product: products[1].id_product, quantity: 40, purchase_price: 4.50, id_supplier: suppliers[1].id_supplier, id_user: adminUser.id_user, date: receptionDate },
    { id_product: products[2].id_product, quantity: 80, purchase_price: 1.50, id_supplier: suppliers[0].id_supplier, id_user: employeeUser.id_user, date: receptionDate },
    { id_product: products[3].id_product, quantity: 60, purchase_price: 3.20, id_supplier: suppliers[3].id_supplier, id_user: employeeUser.id_user, date: receptionDate },
    { id_product: products[4].id_product, quantity: 30, purchase_price: 4.50, id_supplier: suppliers[3].id_supplier, id_user: adminUser.id_user, date: new Date("2026-06-16") },
    { id_product: products[5].id_product, quantity: 25, purchase_price: 8.00, id_supplier: suppliers[3].id_supplier, id_user: adminUser.id_user, date: new Date("2026-06-16") },
    { id_product: products[6].id_product, quantity: 30, purchase_price: 12.00, id_supplier: suppliers[2].id_supplier, id_user: adminUser.id_user, date: new Date("2026-06-16") },
    { id_product: products[7].id_product, quantity: 100, purchase_price: 2.00, id_supplier: suppliers[4].id_supplier, id_user: employeeUser.id_user, date: new Date("2026-06-17") },
    { id_product: products[9].id_product, quantity: 40, purchase_price: 6.50, id_supplier: suppliers[2].id_supplier, id_user: adminUser.id_user, date: new Date("2026-06-17") },
    { id_product: products[11].id_product, quantity: 100, purchase_price: 2.80, id_supplier: suppliers[4].id_supplier, id_user: employeeUser.id_user, date: new Date("2026-06-18") },
    { id_product: products[12].id_product, quantity: 80, purchase_price: 2.50, id_supplier: suppliers[4].id_supplier, id_user: employeeUser.id_user, date: new Date("2026-06-18") },
  ];

  const receptions = [];
  for (const rec of receptionData) {
    const reception = await prisma.productReceptions.create({ data: rec });
    await prisma.stockMovements.create({
      data: {
        id_product: rec.id_product,
        quantity: rec.quantity,
        movement_type: "IN",
        reference_id: reception.id_reception,
      },
    });
    console.log(`Recepción creada para producto ID ${rec.id_product}`);
    receptions.push(reception);
  }

  // ─── VENTAS ─────────────────────────────────────────────────
  const salesData = [
    {
      payment_method: "EFECTIVO",
      operation_number: "OP-20260615-001",
      total: 32.30,
      id_user: employeeUser.id_user,
      id_customer: customers[0].id_customer,
      date: new Date("2026-06-16"),
      details: [
        { id_product: products[0].id_product, quantity: 2, unit_price: 7.50 },
        { id_product: products[12].id_product, quantity: 3, unit_price: 3.80 },
        { id_product: products[4].id_product, quantity: 1, unit_price: 6.50 },
      ],
    },
    {
      payment_method: "TARJETA",
      operation_number: "OP-20260616-002",
      total: 24.50,
      id_user: adminUser.id_user,
      id_customer: customers[1].id_customer,
      date: new Date("2026-06-17"),
      details: [
        { id_product: products[3].id_product, quantity: 2, unit_price: 4.80 },
        { id_product: products[6].id_product, quantity: 1, unit_price: 18.50 },
      ],
    },
    {
      payment_method: "EFECTIVO",
      operation_number: "OP-20260617-003",
      total: 18.30,
      id_user: employeeUser.id_user,
      id_customer: customers[2].id_customer,
      date: new Date("2026-06-18"),
      details: [
        { id_product: products[11].id_product, quantity: 2, unit_price: 4.50 },
        { id_product: products[9].id_product, quantity: 1, unit_price: 9.90 },
      ],
    },
    {
      payment_method: "YAPE",
      operation_number: `OP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-004`,
      total: 55.50,
      id_user: adminUser.id_user,
      id_customer: customers[3].id_customer,
      date: new Date(),
      details: [
        { id_product: products[2].id_product, quantity: 5, unit_price: 2.50 },
        { id_product: products[5].id_product, quantity: 2, unit_price: 12.00 },
        { id_product: products[7].id_product, quantity: 5, unit_price: 3.20 },
      ],
    },
  ];

  for (const saleData of salesData) {
    const existingSale = await prisma.sales.findUnique({ where: { operation_number: saleData.operation_number } });
    if (existingSale) {
      console.log(`Venta existente ignorada: ${saleData.operation_number}`);
      continue;
    }

    const { details, ...saleFields } = saleData;
    const sale = await prisma.sales.create({ data: saleFields });

    for (const detail of details) {
      await prisma.saleDetails.create({
        data: {
          id_sale: sale.id_sale,
          ...detail,
        },
      });
      await prisma.stockMovements.create({
        data: {
          id_product: detail.id_product,
          quantity: -detail.quantity,
          movement_type: "OUT",
          reference_id: sale.id_sale,
        },
      });
    }

    console.log(`Venta creada: ${saleData.operation_number} (S/ ${saleData.total})`);
  }

  console.log("╔═══════════════════════════════════╗");
  console.log("║       SEED COMPLETADO            ║");
  console.log("╚═══════════════════════════════════╝");
  console.log(`Categorías: ${categories.length}`);
  console.log(`Productos: ${products.length}`);
  console.log(`Proveedores: ${suppliers.length}`);
  console.log(`Clientes: ${customers.length}`);
  console.log(`Recepciones: ${receptions.length}`);
  console.log(`Ventas: ${salesData.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
