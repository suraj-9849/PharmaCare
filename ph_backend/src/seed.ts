import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient, PaymentMethod } from '@prisma/client';
import { hashPassword } from './utils/helpers';
import env from './config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 60000,
  statement_timeout: 60000,
  query_timeout: 60000,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  transactionOptions: {
    timeout: 60000, // 60 seconds
    maxWait: 60000, // 60 seconds
  },
});

async function main() {
  console.log('🌱 Starting minimal shelf-organizer focused seeding...\n');

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'ph@gmail.com' },
    });

    let adminUser;

    if (existingAdmin) {
      console.log('✅ Admin user already exists.\n');
      adminUser = existingAdmin;
    } else {
      console.log('👤 Creating admin user...');
      const hashedPassword = await hashPassword('ph@123');

      adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'ph@gmail.com',
          passwordHash: hashedPassword,
          role: 'ADMIN',
        },
      });
      console.log(`✅ Admin user created: ${adminUser.email}\n`);
    }

    // Create Pharmacist User
    console.log('👨‍⚕️  Creating pharmacist user...');
    const existingPharmacist = await prisma.user.findUnique({
      where: { email: 'pharmacist@gmail.com' },
    });

    if (!existingPharmacist) {
      const pharmacistPassword = await hashPassword('pharma@123');
      await prisma.user.create({
        data: {
          username: 'pharmacist',
          email: 'pharmacist@gmail.com',
          passwordHash: pharmacistPassword,
          role: 'PHARMACIST',
        },
      });
      console.log('✅ Pharmacist user created\n');
    } else {
      console.log('✅ Pharmacist user already exists\n');
    }

    // Create Cashier User
    console.log('💳 Creating cashier user...');
    const existingCashier = await prisma.user.findUnique({
      where: { email: 'cashier@gmail.com' },
    });

    if (!existingCashier) {
      const cashierPassword = await hashPassword('cashier@123');
      await prisma.user.create({
        data: {
          username: 'cashier',
          email: 'cashier@gmail.com',
          passwordHash: cashierPassword,
          role: 'CASHIER',
        },
      });
      console.log('✅ Cashier user created\n');
    } else {
      console.log('✅ Cashier user already exists\n');
    }

    // Create Suppliers
    console.log('📦 Creating suppliers...');
    const suppliers = [];
    const supplierData = [
      {
        name: 'MedPlus Pharma',
        phone: '+91-9876543210',
        email: 'contact@medplus.com',
        address: '123 Medical Street, Mumbai',
      },
      {
        name: 'PharmaWorld',
        phone: '+91-9876543211',
        email: 'sales@pharmaworld.in',
        address: '456 Health Avenue, Delhi',
      },
      {
        name: 'HealthCare Solutions',
        phone: '+91-9876543212',
        email: 'info@hcs.com',
        address: '789 Wellness Road, Bangalore',
      },
    ];

    for (const supplier of supplierData) {
      const existing = await prisma.supplier.findFirst({
        where: { supplierName: supplier.name },
      });

      if (!existing) {
        const created = await prisma.supplier.create({
          data: {
            supplierName: supplier.name,
            contactNumber: supplier.phone,
            email: supplier.email,
            address: supplier.address,
          },
        });
        suppliers.push(created);
      } else {
        suppliers.push(existing);
      }
    }
    console.log(`✅ Created/Retrieved ${suppliers.length} suppliers\n`);

    // Create Drugs
    console.log('💊 Creating drugs...');
    const drugs: Array<{ id: string; brandName: string }> = [];
    const drugData = [
      {
        brand: 'Dolo 650',
        generic: 'Paracetamol',
        chemical: 'N-acetyl-p-aminophenol',
        dosage: '650mg',
        category: 'Analgesics',
        mfg: 'Micro Labs',
        rx: false,
        reorder: 50,
      },
      {
        brand: 'Crocin Advance',
        generic: 'Paracetamol',
        chemical: 'N-acetyl-p-aminophenol',
        dosage: '500mg',
        category: 'Analgesics',
        mfg: 'GSK',
        rx: false,
        reorder: 40,
      },
      {
        brand: 'Disprin',
        generic: 'Aspirin',
        chemical: 'Acetylsalicylic Acid',
        dosage: '325mg',
        category: 'Analgesics',
        mfg: 'Reckitt Benckiser',
        rx: false,
        reorder: 45,
      },
      {
        brand: 'Azithral 500',
        generic: 'Azithromycin',
        chemical: 'Azithromycin Dihydrate',
        dosage: '500mg',
        category: 'Antibiotics',
        mfg: 'Alembic Pharma',
        rx: true,
        reorder: 30,
      },
      {
        brand: 'Augmentin 625',
        generic: 'Amoxicillin + Clavulanic Acid',
        chemical: 'Amoxicillin Trihydrate + Potassium Clavulanate',
        dosage: '625mg',
        category: 'Antibiotics',
        mfg: 'GSK',
        rx: true,
        reorder: 35,
      },
      {
        brand: 'Brufen 400',
        generic: 'Ibuprofen',
        chemical: '2-(4-Isobutylphenyl)propionic acid',
        dosage: '400mg',
        category: 'Anti-inflammatory',
        mfg: 'Abbott',
        rx: false,
        reorder: 45,
      },
      {
        brand: 'Cortisone-H',
        generic: 'Hydrocortisone',
        chemical: '11β,17,21-Trihydroxypregn-4-ene-3,20-dione',
        dosage: '10mg',
        category: 'Corticosteroids',
        mfg: 'Pfizer',
        rx: true,
        reorder: 25,
      },
      {
        brand: 'Benadryl Cough Syrup',
        generic: 'Dextromethorphan',
        chemical: '3-Methoxy-17-methyl-9α,13α,14α-morphinan',
        dosage: '100ml',
        category: 'Cough Suppressants',
        mfg: 'Johnson & Johnson',
        rx: false,
        reorder: 35,
      },
      {
        brand: 'Glycomet 500',
        generic: 'Metformin',
        chemical: 'N,N-Dimethylimidodicarbonimidic diamide hydrochloride',
        dosage: '500mg',
        category: 'Antidiabetic',
        mfg: 'USV Pharma',
        rx: true,
        reorder: 60,
      },
      {
        brand: 'Lipitor 10',
        generic: 'Atorvastatin',
        chemical: 'Atorvastatin Calcium Trihydrate',
        dosage: '10mg',
        category: 'Statins',
        mfg: 'Pfizer',
        rx: true,
        reorder: 40,
      },
      {
        brand: 'Omez 20',
        generic: 'Omeprazole',
        chemical:
          '5-Methoxy-2-[[(4-methoxy-3,5-dimethyl-2-pyridinyl)methyl]sulfinyl]-1H-benzimidazole',
        dosage: '20mg',
        category: 'Proton Pump Inhibitors',
        mfg: "Dr. Reddy's",
        rx: true,
        reorder: 30,
      },
      {
        brand: 'Limcee 500',
        generic: 'Ascorbic Acid',
        chemical: 'L-ascorbic acid (Vitamin C)',
        dosage: '500mg',
        category: 'Vitamins',
        mfg: 'Abbott',
        rx: false,
        reorder: 100,
      },
      {
        brand: 'Allegra 120',
        generic: 'Fexofenadine',
        chemical:
          '2-[4-[1-Hydroxy-4-[4-(hydroxydiphenylmethyl)-1-piperidinyl]butyl]phenyl]-2-methylpropanoic acid',
        dosage: '120mg',
        category: 'Antihistamines',
        mfg: 'Sanofi',
        rx: false,
        reorder: 50,
      },
      {
        brand: 'Pan 40',
        generic: 'Pantoprazole',
        chemical:
          '5-(Difluoromethoxy)-2-[[(3,4-dimethoxy-2-pyridinyl)methyl]sulfinyl]-1H-benzimidazole',
        dosage: '40mg',
        category: 'Proton Pump Inhibitors',
        mfg: 'Alkem Labs',
        rx: false,
        reorder: 40,
      },
      {
        brand: 'Cetrizine-10',
        generic: 'Cetirizine',
        chemical: '2-[2-[4-[(4-Chlorophenyl)-phenylmethyl]piperazin-1-yl]ethoxy]acetic acid',
        dosage: '10mg',
        category: 'Antihistamines',
        mfg: 'Cipla',
        rx: false,
        reorder: 45,
      },
    ];

    for (const drug of drugData) {
      const existing = await prisma.drug.findFirst({
        where: { brandName: drug.brand },
      });

      if (!existing) {
        const created = await prisma.drug.create({
          data: {
            brandName: drug.brand,
            genericName: drug.generic,
            chemicalName: drug.chemical,
            dosage: drug.dosage,
            category: drug.category,
            manufacturer: drug.mfg,
            requiresPrescription: drug.rx,
            reorderLevel: drug.reorder,
          },
        });
        drugs.push(created);
      } else {
        drugs.push(existing);
      }
    }
    console.log(`✅ Created/Retrieved ${drugs.length} drugs\n`);

    // Create Inventory Batches
    console.log('📊 Creating inventory batches...');
    const batches = [];
    for (let i = 0; i < drugs.length; i++) {
      const drug = drugs[i];
      const supplier = suppliers[i % suppliers.length];

      const batchNumber = `${drug.brandName.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}-2024`;
      const quantity = i === 4 ? 0 : Math.floor(Math.random() * 500) + 100; // Make one out of stock

      const existing = await prisma.inventoryBatch.findFirst({
        where: { batchNumber },
      });

      if (!existing) {
        const created = await prisma.inventoryBatch.create({
          data: {
            drugId: drug.id,
            batchNumber,
            quantity,
            purchasePrice: Math.floor(Math.random() * 50) + 10,
            sellPrice: Math.floor(Math.random() * 100) + 20,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            supplierId: supplier.id,
            location: `Shelf-${String.fromCharCode(65 + (i % 5))}-${(i % 10) + 1}`,
          },
        });
        batches.push(created);
      } else {
        batches.push(existing);
      }
    }
    console.log(`✅ Created/Retrieved ${batches.length} inventory batches\n`);

    // Create Near-Expiry Batches (expiring within 7-30 days)
    console.log('⚠️  Creating near-expiry inventory batches...');
    const nearExpiryBatches = [];
    const nearExpiryData = [
      { drugIndex: 0, days: 3, qty: 50, batch: 'PAR-EXP-001' }, // Paracetamol - 3 days
      { drugIndex: 1, days: 5, qty: 30, batch: 'ASP-EXP-002' }, // Aspirin - 5 days
      { drugIndex: 2, days: 7, qty: 25, batch: 'AMO-EXP-003' }, // Amoxicillin - 7 days
      { drugIndex: 3, days: 10, qty: 40, batch: 'IBU-EXP-004' }, // Ibuprofen - 10 days
      { drugIndex: 4, days: 14, qty: 20, batch: 'KOR-EXP-005' }, // Kortex - 14 days
      { drugIndex: 5, days: 21, qty: 60, batch: 'COU-EXP-006' }, // Cough Syrup - 21 days
      { drugIndex: 6, days: 25, qty: 35, batch: 'MET-EXP-007' }, // Metformin - 25 days
      { drugIndex: 7, days: 28, qty: 45, batch: 'ATO-EXP-008' }, // Atorvastatin - 28 days
      { drugIndex: 8, days: 30, qty: 55, batch: 'OME-EXP-009' }, // Omeprazole - 30 days
      { drugIndex: 9, days: 2, qty: 100, batch: 'VIT-EXP-010' }, // Vitamin C - 2 days (critical!)
    ];

    for (const item of nearExpiryData) {
      if (drugs[item.drugIndex]) {
        const existing = await prisma.inventoryBatch.findFirst({
          where: { batchNumber: item.batch },
        });

        if (!existing) {
          const created = await prisma.inventoryBatch.create({
            data: {
              drugId: drugs[item.drugIndex].id,
              batchNumber: item.batch,
              quantity: item.qty,
              purchasePrice: Math.floor(Math.random() * 30) + 5,
              sellPrice: Math.floor(Math.random() * 60) + 15,
              expiryDate: new Date(Date.now() + item.days * 24 * 60 * 60 * 1000),
              supplierId: suppliers[item.drugIndex % suppliers.length].id,
              location: `Expiry-Zone-${item.drugIndex + 1}`,
            },
          });
          nearExpiryBatches.push(created);
        } else {
          nearExpiryBatches.push(existing);
        }
      }
    }
    console.log(`✅ Created/Retrieved ${nearExpiryBatches.length} near-expiry batches\n`);

    // Create Already Expired Batches
    console.log('🚨 Creating expired inventory batches...');
    const expiredBatches = [];
    const expiredData = [
      { drugIndex: 0, daysAgo: 5, qty: 25, batch: 'PAR-OLD-001' }, // Paracetamol - expired 5 days ago
      { drugIndex: 2, daysAgo: 10, qty: 15, batch: 'AMO-OLD-002' }, // Amoxicillin - expired 10 days ago
      { drugIndex: 5, daysAgo: 3, qty: 30, batch: 'COU-OLD-003' }, // Cough Syrup - expired 3 days ago
      { drugIndex: 7, daysAgo: 7, qty: 20, batch: 'ATO-OLD-004' }, // Atorvastatin - expired 7 days ago
      { drugIndex: 9, daysAgo: 1, qty: 50, batch: 'VIT-OLD-005' }, // Vitamin C - expired yesterday
    ];

    for (const item of expiredData) {
      if (drugs[item.drugIndex]) {
        const existing = await prisma.inventoryBatch.findFirst({
          where: { batchNumber: item.batch },
        });

        if (!existing) {
          const created = await prisma.inventoryBatch.create({
            data: {
              drugId: drugs[item.drugIndex].id,
              batchNumber: item.batch,
              quantity: item.qty,
              purchasePrice: Math.floor(Math.random() * 20) + 5,
              sellPrice: Math.floor(Math.random() * 40) + 10,
              expiryDate: new Date(Date.now() - item.daysAgo * 24 * 60 * 60 * 1000),
              supplierId: suppliers[item.drugIndex % suppliers.length].id,
              location: `Quarantine-${item.drugIndex + 1}`,
            },
          });
          expiredBatches.push(created);
        } else {
          expiredBatches.push(existing);
        }
      }
    }
    console.log(`✅ Created/Retrieved ${expiredBatches.length} expired batches\n`);

    // Create Low Stock Batches
    console.log('📉 Creating low stock inventory batches...');
    const lowStockBatches = [];
    const lowStockData = [
      { drugIndex: 0, qty: 5, batch: 'PAR-LOW-001' }, // Paracetamol - very low (reorder: 50)
      { drugIndex: 2, qty: 8, batch: 'AMO-LOW-002' }, // Amoxicillin - low (reorder: 30)
      { drugIndex: 3, qty: 10, batch: 'IBU-LOW-003' }, // Ibuprofen - low (reorder: 45)
      { drugIndex: 6, qty: 12, batch: 'MET-LOW-004' }, // Metformin - low (reorder: 60)
      { drugIndex: 9, qty: 15, batch: 'VIT-LOW-005' }, // Vitamin C - low (reorder: 100)
    ];

    for (const item of lowStockData) {
      if (drugs[item.drugIndex]) {
        const existing = await prisma.inventoryBatch.findFirst({
          where: { batchNumber: item.batch },
        });

        if (!existing) {
          const created = await prisma.inventoryBatch.create({
            data: {
              drugId: drugs[item.drugIndex].id,
              batchNumber: item.batch,
              quantity: item.qty,
              purchasePrice: Math.floor(Math.random() * 30) + 10,
              sellPrice: Math.floor(Math.random() * 50) + 20,
              expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
              supplierId: suppliers[item.drugIndex % suppliers.length].id,
              location: `Shelf-Main-${item.drugIndex + 1}`,
            },
          });
          lowStockBatches.push(created);
        } else {
          lowStockBatches.push(existing);
        }
      }
    }
    console.log(`✅ Created/Retrieved ${lowStockBatches.length} low stock batches\n`);

    // Delete existing shelf locations to start fresh
    console.log('🗑️  Clearing existing shelf locations...');
    await prisma.inventoryBatch.updateMany({
      data: { shelfLocationId: null, slotPosition: null, queuePosition: null },
    });
    await prisma.shelfLocation.deleteMany({});
    console.log('✅ Cleared existing shelf data\n');

    // Create Shelf Locations for Smart Shelf Management (4 shelves, 4x5 matrix = 20 slots each)
    console.log('🏪 Creating shelf locations (4 shelves with 4x5 matrix)...');
    const shelfLocations = [];
    const shelfData = [
      {
        code: 'SHELF-A',
        name: 'Main Shelf A',
        row: '4',
        column: '5',
        zone: 'General',
        capacity: 20,
        notes: '4x5 matrix - Rows 1-4, Columns 1-5',
      },
      {
        code: 'SHELF-B',
        name: 'Main Shelf B',
        row: '4',
        column: '5',
        zone: 'Prescription',
        capacity: 20,
        notes: '4x5 matrix - Rows 1-4, Columns 1-5',
      },
      {
        code: 'SHELF-C',
        name: 'Main Shelf C',
        row: '4',
        column: '5',
        zone: 'OTC',
        capacity: 20,
        notes: '4x5 matrix - Rows 1-4, Columns 1-5',
      },
      {
        code: 'SHELF-D',
        name: 'Expiry Watch Shelf',
        row: '4',
        column: '5',
        zone: 'Near Expiry',
        capacity: 20,
        notes: '4x5 matrix - Rows 1-4, Columns 1-5',
      },
    ];

    for (const shelf of shelfData) {
      const created = await prisma.shelfLocation.create({
        data: {
          shelfCode: shelf.code,
          shelfName: shelf.name,
          row: shelf.row,
          column: shelf.column,
          zone: shelf.zone,
          capacity: shelf.capacity,
          status: 'ACTIVE',
          notes: shelf.notes,
        },
      });
      shelfLocations.push(created);
    }
    console.log(`✅ Created ${shelfLocations.length} shelf locations\n`);

    // Assign ALL batches to shelf locations with slot positions (4x5 matrix: slots 1-20)
    console.log('📍 Assigning all batches to shelf slots...');
    let assignedCount = 0;

    // Track slot counts per shelf
    const shelfSlotCounts = [0, 0, 0, 0]; // SHELF-A, B, C, D

    // First, distribute normal batches across shelves A, B, C
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const shelfIndex = i % 3; // Rotate through A, B, C
      const shelf = shelfLocations[shelfIndex];
      const slotPosition = shelfSlotCounts[shelfIndex] + 1;

      await prisma.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          shelfLocationId: shelf.id,
          slotPosition,
          queuePosition: shelfSlotCounts[shelfIndex],
        },
      });
      shelfSlotCounts[shelfIndex]++;
      assignedCount++;
    }

    // Distribute near-expiry batches across ALL 4 shelves (4-5 per shelf)
    const expiringBatches = [...nearExpiryBatches, ...expiredBatches];
    for (let i = 0; i < expiringBatches.length; i++) {
      const batch = expiringBatches[i];
      const shelfIndex = i % 4; // Rotate through all 4 shelves
      const shelf = shelfLocations[shelfIndex];
      const slotPosition = shelfSlotCounts[shelfIndex] + 1;

      await prisma.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          shelfLocationId: shelf.id,
          slotPosition,
          queuePosition: shelfSlotCounts[shelfIndex],
        },
      });
      shelfSlotCounts[shelfIndex]++;
      assignedCount++;
    }

    // Distribute low stock batches across shelves A, B, C
    for (let i = 0; i < lowStockBatches.length; i++) {
      const batch = lowStockBatches[i];
      const shelfIndex = i % 3; // Rotate through A, B, C
      const shelf = shelfLocations[shelfIndex];
      const slotPosition = shelfSlotCounts[shelfIndex] + 1;

      await prisma.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          shelfLocationId: shelf.id,
          slotPosition,
          queuePosition: shelfSlotCounts[shelfIndex],
        },
      });
      shelfSlotCounts[shelfIndex]++;
      assignedCount++;
    }

    console.log(`✅ Assigned ${assignedCount} batches to shelf slots`);
    console.log(
      `   SHELF-A: ${shelfSlotCounts[0]} items, SHELF-B: ${shelfSlotCounts[1]} items, SHELF-C: ${shelfSlotCounts[2]} items, SHELF-D: ${shelfSlotCounts[3]} items\n`
    );

    // Create Customers
    console.log('👥 Creating customers...');
    const customers = [];
    const firstNames = [
      'John',
      'Jane',
      'Rajesh',
      'Priya',
      'Amit',
      'Sneha',
      'Vikram',
      'Anita',
      'Rohan',
      'Divya',
      'Arjun',
      'Neha',
      'Sanjay',
      'Pooja',
      'Arun',
      'Sakshi',
      'Nikhil',
      'Isha',
      'Varun',
      'Meera',
    ];
    const lastNames = [
      'Doe',
      'Smith',
      'Kumar',
      'Sharma',
      'Patel',
      'Singh',
      'Gupta',
      'Verma',
      'Khan',
      'Rao',
    ];
    const cities = [
      'Mumbai',
      'Delhi',
      'Bangalore',
      'Pune',
      'Hyderabad',
      'Chennai',
      'Kolkata',
      'Ahmedabad',
    ];

    // Generate 50 customers
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const city = cities[Math.floor(Math.random() * cities.length)];
      const phone = `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      const address = `${Math.floor(Math.random() * 999) + 1} ${['Main', 'Oak', 'Park', 'River', 'Grand', 'Hill'][Math.floor(Math.random() * 6)]} Street, ${city}`;

      const existing = await prisma.customer.findFirst({
        where: { email },
      });

      if (!existing) {
        const created = await prisma.customer.create({
          data: {
            name,
            phone,
            email,
            address,
          },
        });
        customers.push(created);
      } else {
        customers.push(existing);
      }
    }
    console.log(`✅ Created/Retrieved ${customers.length} customers\n`);

    // Create Sales with Items
    console.log('💰 Creating sales transactions...');
    let saleCount = 0;
    const doctors = [
      'Dr. Smith',
      'Dr. Johnson',
      'Dr. Patel',
      'Dr. Williams',
      'Dr. Brown',
      'Dr. Anderson',
      'Dr. Davis',
      'Dr. Miller',
    ];

    // Create 80 sales transactions
    for (let i = 0; i < 80; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const user = adminUser;

      // Generate 1-5 random items for each sale
      const itemCount = Math.floor(Math.random() * 5) + 1;
      const saleItems = [];
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const batch = batches[Math.floor(Math.random() * batches.length)];
        const quantity = Math.floor(Math.random() * 10) + 1;
        const unitPrice = Number(batch.sellPrice);
        const subtotal = quantity * unitPrice;
        totalAmount += subtotal;

        saleItems.push({
          drugId: batch.drugId,
          batchId: batch.id,
          quantity,
          unitPrice,
          subtotal,
        });
      }

      try {
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30)); // Random past 30 days

        const sale = await prisma.sale.create({
          data: {
            userId: user.id,
            customerId: customer.id,
            totalAmount,
            paymentMethod: ['CASH', 'CARD', 'UPI', 'CREDIT'][
              Math.floor(Math.random() * 4)
            ] as PaymentMethod,
            cashReceived: totalAmount + (Math.random() > 0.5 ? Math.floor(Math.random() * 100) : 0),
            changeGiven: 0,
            saleDate,
            status: 'COMPLETED',
            saleItems: {
              create: saleItems,
            },
          },
        });

        // Create corresponding prescription history
        const medications = saleItems.map((item) => {
          const drug = drugs.find((d) => d.id === item.drugId);
          return {
            medicationName: drug?.brandName || 'Unknown',
            dosage: `${Math.floor(Math.random() * 500) + 100}mg`,
            frequency: ['Once daily', 'Twice daily', 'Thrice daily', 'Four times daily'][
              Math.floor(Math.random() * 4)
            ],
            duration: `${Math.floor(Math.random() * 14) + 1} days`,
            quantity: item.quantity,
            instructions: [
              'Take with food',
              'Take on empty stomach',
              'Take with water',
              'Take after meals',
            ][Math.floor(Math.random() * 4)],
          };
        });

        await prisma.prescriptionHistory.create({
          data: {
            saleId: sale.id,
            patientName: customer.name,
            doctorName: doctors[Math.floor(Math.random() * doctors.length)],
            prescriptionDate: saleDate,
            medications: JSON.stringify(medications),
            totalAmount,
            paymentMethod: sale.paymentMethod,
            customerName: customer.name,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            customerAddress: customer.address,
            confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
          },
        });

        saleCount++;
      } catch (_error) {
        // Skip duplicate or errored sales
        continue;
      }
    }
    console.log(`✅ Created ${saleCount} sales transactions with prescription histories\n`);

    // Create Stock Alerts
    console.log('🚨 Creating stock alerts...');
    let alertCount = 0;
    for (const batch of batches) {
      if (batch.quantity < 50) {
        const existing = await prisma.stockAlert.findFirst({
          where: { drugId: batch.drugId },
        });

        if (!existing) {
          await prisma.stockAlert.create({
            data: {
              drugId: batch.drugId,
              alertType: batch.quantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
              message:
                batch.quantity === 0
                  ? 'Item is out of stock'
                  : `Stock below reorder level: ${batch.quantity} units`,
            },
          });
          alertCount++;
        }
      }
    }
    console.log(`✅ Created ${alertCount} stock alerts\n`);

    // Create System Settings
    console.log('⚙️  Creating system settings...');
    const existingSettings = await prisma.systemSetting.findFirst({
      where: { key: 'tax_rate' },
    });

    if (!existingSettings) {
      await prisma.systemSetting.create({
        data: { key: 'tax_rate', value: '18' },
      });
      await prisma.systemSetting.create({
        data: { key: 'currency', value: 'INR' },
      });
      await prisma.systemSetting.create({
        data: { key: 'company_name', value: 'PharmaCare' },
      });
      console.log('✅ System settings created\n');
    } else {
      console.log('✅ System settings already exist\n');
    }

    console.log('✨ Database seeding completed successfully!');
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  📊 SEEDING SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Users: Admin, Pharmacist, Cashier`);
    console.log(`  Suppliers: ${suppliers.length}`);
    console.log(`  Drugs: ${drugs.length}`);
    console.log(`  Inventory Batches: ${batches.length}`);
    console.log(`  Customers: ${customers.length}`);
    console.log(`  Sales Transactions: ${saleCount}`);
    console.log(`  Stock Alerts: ${alertCount}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🔐 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Admin:');
    console.log('    Email: ph@gmail.com');
    console.log('    Password: ph@123');
    console.log('\n  Pharmacist:');
    console.log('    Email: pharmacist@gmail.com');
    console.log('    Password: pharma@123');
    console.log('\n  Cashier:');
    console.log('    Email: cashier@gmail.com');
    console.log('    Password: cashier@123');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
