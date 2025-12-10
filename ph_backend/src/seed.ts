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
});

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');

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
        brand: 'Paracetamol',
        generic: 'Acetaminophen',
        category: 'Analgesic',
        mfg: 'ABC Pharma',
        rx: false,
        reorder: 50,
      },
      {
        brand: 'Aspirin',
        generic: 'Acetylsalicylic Acid',
        category: 'Analgesic',
        mfg: 'XYZ Pharma',
        rx: false,
        reorder: 40,
      },
      {
        brand: 'Amoxicillin',
        generic: 'Amoxicillin Trihydrate',
        category: 'Antibiotic',
        mfg: 'DEF Pharma',
        rx: true,
        reorder: 30,
      },
      {
        brand: 'Ibuprofen',
        generic: 'Ibuprofen',
        category: 'Anti-inflammatory',
        mfg: 'GHI Pharma',
        rx: false,
        reorder: 45,
      },
      {
        brand: 'Kortex',
        generic: 'Hydrocortisone',
        category: 'Corticosteroid',
        mfg: 'JKL Pharma',
        rx: true,
        reorder: 25,
      },
      {
        brand: 'Cough Syrup',
        generic: 'Dextromethorphan',
        category: 'Cough Suppressant',
        mfg: 'MNO Pharma',
        rx: false,
        reorder: 35,
      },
      {
        brand: 'Metformin',
        generic: 'Metformin HCl',
        category: 'Antidiabetic',
        mfg: 'PQR Pharma',
        rx: true,
        reorder: 60,
      },
      {
        brand: 'Atorvastatin',
        generic: 'Atorvastatin Calcium',
        category: 'Statin',
        mfg: 'STU Pharma',
        rx: true,
        reorder: 40,
      },
      {
        brand: 'Omeprazole',
        generic: 'Omeprazole',
        category: 'Proton Pump Inhibitor',
        mfg: 'VWX Pharma',
        rx: true,
        reorder: 30,
      },
      {
        brand: 'Vitamin C',
        generic: 'Ascorbic Acid',
        category: 'Vitamin',
        mfg: 'YZA Pharma',
        rx: false,
        reorder: 100,
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