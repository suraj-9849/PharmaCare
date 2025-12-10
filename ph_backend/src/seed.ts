import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, PaymentMethod } from '@prisma/client';
import { hashPassword } from './utils/helpers';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Create Admin User (ph@gmail.com / ph@123)
  console.log('👤 Creating admin user...');
  const hashedPassword = await hashPassword('ph@123');

  const adminUser = await prisma.user.upsert({
    where: { email: 'ph@gmail.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'ph@gmail.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`   ✅ Admin user created: ${adminUser.email}`);

  // Create sample suppliers
  console.log('\n📦 Creating suppliers...');
  void (await prisma.supplier.upsert({
    where: { id: 'supplier-medplus' },
    update: {},
    create: {
      id: 'supplier-medplus',
      supplierName: 'MedPlus Corp',
      contactNumber: '+91-9876543210',
      email: 'contact@medplus.com',
      address: '123 Medical Street, Mumbai, Maharashtra 400001',
    },
  }));

  void (await prisma.supplier.upsert({
    where: { id: 'supplier-pharmaworld' },
    update: {},
    create: {
      id: 'supplier-pharmaworld',
      supplierName: 'PharmaWorld Distributors',
      contactNumber: '+91-9876543211',
      email: 'sales@pharmaworld.in',
      address: '456 Health Avenue, Delhi 110001',
    },
  }));
  console.log(`   ✅ Created ${2} suppliers`);

  // Create sample drugs
  console.log('\n💊 Creating drugs...');
  const drugs = [
    {
      id: 'drug-paracetamol',
      brandName: 'Dolo 650',
      genericName: 'Paracetamol',
      category: 'Analgesics',
      manufacturer: 'Micro Labs Ltd',
      requiresPrescription: false,
      reorderLevel: 50,
      sku: 'ANA-DOL-001',
    },
    {
      id: 'drug-amoxicillin',
      brandName: 'Mox 500',
      genericName: 'Amoxicillin',
      category: 'Antibiotics',
      manufacturer: 'Cipla Ltd',
      requiresPrescription: true,
      reorderLevel: 30,
      sku: 'ANT-MOX-001',
    },
    {
      id: 'drug-cetirizine',
      brandName: 'Cetzine',
      genericName: 'Cetirizine',
      category: 'Antihistamines',
      manufacturer: 'Sun Pharma',
      requiresPrescription: false,
      reorderLevel: 40,
      sku: 'ANH-CET-001',
    },
    {
      id: 'drug-omeprazole',
      brandName: 'Omez',
      genericName: 'Omeprazole',
      category: 'Gastrointestinal',
      manufacturer: "Dr. Reddy's",
      requiresPrescription: false,
      reorderLevel: 35,
      sku: 'GAS-OME-001',
    },
    {
      id: 'drug-metformin',
      brandName: 'Glycomet',
      genericName: 'Metformin',
      category: 'Diabetes',
      manufacturer: 'USV Pvt Ltd',
      requiresPrescription: true,
      reorderLevel: 25,
      sku: 'DIA-GLY-001',
    },
    {
      id: 'drug-azithromycin',
      brandName: 'Azithral 500',
      genericName: 'Azithromycin',
      category: 'Antibiotics',
      manufacturer: 'Alembic Pharma',
      requiresPrescription: true,
      reorderLevel: 30,
      sku: 'ANT-AZI-001',
    },
    {
      id: 'drug-ibuprofen',
      brandName: 'Brufen 400',
      genericName: 'Ibuprofen',
      category: 'Analgesics',
      manufacturer: 'Abbott',
      requiresPrescription: false,
      reorderLevel: 45,
      sku: 'ANA-IBU-001',
    },
    {
      id: 'drug-aspirin',
      brandName: 'Disprin',
      genericName: 'Aspirin',
      category: 'Analgesics',
      manufacturer: 'Reckitt Benckiser',
      requiresPrescription: false,
      reorderLevel: 60,
      sku: 'ANA-ASP-001',
    },
    {
      id: 'drug-losartan',
      brandName: 'Losar 50',
      genericName: 'Losartan',
      category: 'Cardiovascular',
      manufacturer: 'Cipla Ltd',
      requiresPrescription: true,
      reorderLevel: 25,
      sku: 'CAR-LOS-001',
    },
    {
      id: 'drug-atorvastatin',
      brandName: 'Atorva 20',
      genericName: 'Atorvastatin',
      category: 'Cardiovascular',
      manufacturer: 'Zydus Cadila',
      requiresPrescription: true,
      reorderLevel: 30,
      sku: 'CAR-ATO-001',
    },
    {
      id: 'drug-pantoprazole',
      brandName: 'Pan 40',
      genericName: 'Pantoprazole',
      category: 'Gastrointestinal',
      manufacturer: 'Alkem Laboratories',
      requiresPrescription: false,
      reorderLevel: 35,
      sku: 'GAS-PAN-001',
    },
    {
      id: 'drug-ranitidine',
      brandName: 'Aciloc 150',
      genericName: 'Ranitidine',
      category: 'Gastrointestinal',
      manufacturer: 'Cadila Healthcare',
      requiresPrescription: false,
      reorderLevel: 40,
      sku: 'GAS-RAN-001',
    },
    {
      id: 'drug-salbutamol',
      brandName: 'Asthalin Inhaler',
      genericName: 'Salbutamol',
      category: 'Respiratory',
      manufacturer: 'Cipla Ltd',
      requiresPrescription: false,
      reorderLevel: 20,
      sku: 'RES-SAL-001',
    },
    {
      id: 'drug-montelukast',
      brandName: 'Montair 10',
      genericName: 'Montelukast',
      category: 'Respiratory',
      manufacturer: 'Cipla Ltd',
      requiresPrescription: true,
      reorderLevel: 25,
      sku: 'RES-MON-001',
    },
    {
      id: 'drug-levothyroxine',
      brandName: 'Thyronorm 50',
      genericName: 'Levothyroxine',
      category: 'Hormones',
      manufacturer: 'Abbott',
      requiresPrescription: true,
      reorderLevel: 30,
      sku: 'HOR-LEV-001',
    },
    {
      id: 'drug-vitamin-d',
      brandName: 'Uprise D3',
      genericName: 'Vitamin D3',
      category: 'Vitamins',
      manufacturer: 'Alkem Laboratories',
      requiresPrescription: false,
      reorderLevel: 50,
      sku: 'VIT-D3-001',
    },
    {
      id: 'drug-calcium',
      brandName: 'Shelcal 500',
      genericName: 'Calcium Carbonate',
      category: 'Vitamins',
      manufacturer: 'Torrent Pharma',
      requiresPrescription: false,
      reorderLevel: 45,
      sku: 'VIT-CAL-001',
    },
    {
      id: 'drug-multivitamin',
      brandName: 'Becosules',
      genericName: 'Multivitamin',
      category: 'Vitamins',
      manufacturer: 'Pfizer',
      requiresPrescription: false,
      reorderLevel: 50,
      sku: 'VIT-MUL-001',
    },
    {
      id: 'drug-diclofenac',
      brandName: 'Voveran 50',
      genericName: 'Diclofenac',
      category: 'Analgesics',
      manufacturer: 'Novartis',
      requiresPrescription: true,
      reorderLevel: 30,
      sku: 'ANA-DIC-001',
    },
    {
      id: 'drug-ciprofloxacin',
      brandName: 'Ciplox 500',
      genericName: 'Ciprofloxacin',
      category: 'Antibiotics',
      manufacturer: 'Cipla Ltd',
      requiresPrescription: true,
      reorderLevel: 25,
      sku: 'ANT-CIP-001',
    },
  ];

  for (const drug of drugs) {
    await prisma.drug.upsert({
      where: { id: drug.id },
      update: {},
      create: drug,
    });
  }
  console.log(`   ✅ Created ${drugs.length} drugs`);

  // Create sample inventory batches
  console.log('\n📋 Creating inventory batches...');
  const batches = [
    {
      id: 'batch-dolo-001',
      drugId: 'drug-paracetamol',
      batchNumber: 'DL-2024-001',
      quantity: 500,
      purchasePrice: 8.0,
      sellPrice: 12.5,
      expiryDate: new Date('2026-06-30'),
      supplierId: 'supplier-medplus',
      location: 'Shelf A-1',
    },
    {
      id: 'batch-dolo-002',
      drugId: 'drug-paracetamol',
      batchNumber: 'DL-2024-002',
      quantity: 300,
      purchasePrice: 8.5,
      sellPrice: 13.0,
      expiryDate: new Date('2026-12-31'),
      supplierId: 'supplier-pharmaworld',
      location: 'Shelf A-1',
    },
    {
      id: 'batch-mox-001',
      drugId: 'drug-amoxicillin',
      batchNumber: 'MX-2024-001',
      quantity: 200,
      purchasePrice: 25.0,
      sellPrice: 38.0,
      expiryDate: new Date('2025-12-31'),
      supplierId: 'supplier-medplus',
      location: 'Shelf B-2',
    },
    {
      id: 'batch-cet-001',
      drugId: 'drug-cetirizine',
      batchNumber: 'CT-2024-001',
      quantity: 400,
      purchasePrice: 5.0,
      sellPrice: 8.0,
      expiryDate: new Date('2026-03-31'),
      supplierId: 'supplier-pharmaworld',
      location: 'Shelf C-1',
    },
    {
      id: 'batch-omez-001',
      drugId: 'drug-omeprazole',
      batchNumber: 'OM-2024-001',
      quantity: 250,
      purchasePrice: 15.0,
      sellPrice: 22.0,
      expiryDate: new Date('2026-09-30'),
      supplierId: 'supplier-medplus',
      location: 'Shelf D-1',
    },
    {
      id: 'batch-glyc-001',
      drugId: 'drug-metformin',
      batchNumber: 'GL-2024-001',
      quantity: 150,
      purchasePrice: 12.0,
      sellPrice: 18.0,
      expiryDate: new Date('2026-08-31'),
      supplierId: 'supplier-pharmaworld',
      location: 'Shelf E-1',
    },
    {
      id: 'batch-azi-001',
      drugId: 'drug-azithromycin',
      batchNumber: 'AZ-2024-001',
      quantity: 180,
      purchasePrice: 35.0,
      sellPrice: 52.0,
      expiryDate: new Date('2026-05-31'),
      supplierId: 'supplier-medplus',
      location: 'Shelf B-3',
    },
    {
      id: 'batch-ibu-001',
      drugId: 'drug-ibuprofen',
      batchNumber: 'IB-2024-001',
      quantity: 350,
      purchasePrice: 6.0,
      sellPrice: 10.0,
      expiryDate: new Date('2026-11-30'),
      supplierId: 'supplier-pharmaworld',
      location: 'Shelf A-2',
    },
    {
      id: 'batch-asp-001',
      drugId: 'drug-aspirin',
      batchNumber: 'AS-2024-001',
      quantity: 600,
      purchasePrice: 3.0,
      sellPrice: 5.0,
      expiryDate: new Date('2027-01-31'),
      supplierId: 'supplier-medplus',
      location: 'Shelf A-3',
    },
    {
      id: 'batch-los-001',
      drugId: 'drug-losartan',
      batchNumber: 'LS-2024-001',
      quantity: 200,
      purchasePrice: 18.0,
      sellPrice: 28.0,
      expiryDate: new Date('2026-07-31'),
      supplierId: 'supplier-pharmaworld',
      location: 'Shelf F-1',
    },
    {
      id: 'batch-ato-001',
      drugId: 'drug-atorvastatin',
      batchNumber: 'AT-2024-001',
      quantity: 220,
      purchasePrice: 22.0,
      sellPrice: 35.0,
      expiryDate: new Date('2026-10-31'),
      supplierId: 'supplier-medplus',
      location: 'Shelf F-2',
    },
    {
      id: 'batch-pan-001',
      drugId: 'drug-pantoprazole',
      batchNumber: 'PN-2024-001',
      quantity: 280,
      purchasePrice: 12.0,
      sellPrice: 19.0,
      expiryDate: new Date('2026-08-31'),
      supplierId: 'supplier-pharmaworld',
      location: 'Shelf D-2',
    },
    {
      id: 'batch-ran-001',
      drugId: 'drug-ranitidine',
      batchNumber: 'RN-2024-001',
      quantity: 320,
      purchasePrice: 8.0,
      sellPrice: 13.0,
      expiryDate: new Date('2026-04-30'),
      supplierId: 'supplier-medplus',
      location: 'Shelf D-3',
    },
    {
      id: 'batch-sal-001',
      drugId: 'drug-salbutamol',
      batchNumber: 'SL-2024-001',
      quantity: 100,
      purchasePrice: 85.0,
      sellPrice: 125.0,
      expiryDate: new Date('2026-12-31'),
      supplierId: 'supplier-pharmaworld',
      location: 'Shelf G-1',
    },
    {
      id: 'batch-mon-001',
      drugId: 'drug-montelukast',
      batchNumber: 'MN-2024-001',
      quantity: 160,
      purchasePrice: 28.0,
      sellPrice: 42.0,
      expiryDate: new Date('2026-09-30'),
      supplierId: 'supplier-medplus',
      location: 'Shelf G-2',
    },
    {
      id: 'batch-lev-001',
      drugId: 'drug-levothyroxine',
      batchNumber: 'LV-2024-001',
      quantity: 250,
      purchasePrice: 14.0,
      sellPrice: 22.0,
      expiryDate: new Date('2026-11-30'),
      supplierId: 'supplier-pharmaworld',
      location: 'Shelf H-1',
    },
    {
      id: 'batch-vitd-001',
      drugId: 'drug-vitamin-d',
      batchNumber: 'VD-2024-001',
      quantity: 400,
      purchasePrice: 10.0,
      sellPrice: 16.0,
      expiryDate: new Date('2027-03-31'),
      supplierId: 'supplier-medplus',
      location: 'Shelf I-1',
    },
    {
      id: 'batch-cal-001',
      drugId: 'drug-calcium',
      batchNumber: 'CL-2024-001',
      quantity: 380,
      purchasePrice: 12.0,
      sellPrice: 19.0,
      expiryDate: new Date('2027-02-28'),
      supplierId: 'supplier-pharmaworld',
      location: 'Shelf I-2',
    },
    {
      id: 'batch-mul-001',
      drugId: 'drug-multivitamin',
      batchNumber: 'MV-2024-001',
      quantity: 450,
      purchasePrice: 15.0,
      sellPrice: 24.0,
      expiryDate: new Date('2027-01-31'),
      supplierId: 'supplier-medplus',
      location: 'Shelf I-3',
    },
    {
      id: 'batch-dic-001',
      drugId: 'drug-diclofenac',
      batchNumber: 'DC-2024-001',
      quantity: 190,
      purchasePrice: 8.0,
      sellPrice: 13.0,
      expiryDate: new Date('2026-06-30'),
      supplierId: 'supplier-pharmaworld',
      location: 'Shelf A-4',
    },
    {
      id: 'batch-cip-001',
      drugId: 'drug-ciprofloxacin',
      batchNumber: 'CP-2024-001',
      quantity: 170,
      purchasePrice: 32.0,
      sellPrice: 48.0,
      expiryDate: new Date('2026-07-31'),
      supplierId: 'supplier-medplus',
      location: 'Shelf B-4',
    },
  ];

  for (const batch of batches) {
    await prisma.inventoryBatch.upsert({
      where: { id: batch.id },
      update: {},
      create: batch,
    });
  }
  console.log(`   ✅ Created ${batches.length} inventory batches`);

  // Create sample customers
  console.log('\n👥 Creating customers...');
  const customers = [
    {
      id: 'customer-001',
      name: 'Rahul Sharma',
      phone: '+91-9876543001',
      email: 'rahul.sharma@email.com',
      address: '789 Wellness Lane, Bangalore 560001',
    },
    {
      id: 'customer-002',
      name: 'Priya Patel',
      phone: '+91-9876543002',
      email: 'priya.patel@email.com',
      address: '456 Health Road, Chennai 600001',
    },
    {
      id: 'customer-003',
      name: 'Amit Kumar',
      phone: '+91-9876543003',
      email: null,
      address: '123 Medical Colony, Hyderabad 500001',
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: {},
      create: customer,
    });
  }
  console.log(`   ✅ Created ${customers.length} customers`);

  // Create sample sales for the last 3 days
  console.log('\n💰 Creating sample sales for the last 3 days...');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Sales data with quantities for inventory updates
  const salesData = [
    // Day 1 (2 days ago) - 8 sales
    {
      saleDate: twoDaysAgo,
      totalAmount: 50.0,
      paymentMethod: 'CASH',
      cashReceived: 100.0,
      changeGiven: 50.0,
      items: [
        {
          drugId: 'drug-paracetamol',
          batchId: 'batch-dolo-001',
          quantity: 4,
          unitPrice: 12.5,
          subtotal: 50.0,
        },
      ],
    },
    {
      saleDate: twoDaysAgo,
      totalAmount: 114.0,
      paymentMethod: 'UPI',
      items: [
        {
          drugId: 'drug-amoxicillin',
          batchId: 'batch-mox-001',
          quantity: 3,
          unitPrice: 38.0,
          subtotal: 114.0,
        },
      ],
    },
    {
      saleDate: twoDaysAgo,
      totalAmount: 80.0,
      paymentMethod: 'CASH',
      cashReceived: 100.0,
      changeGiven: 20.0,
      items: [
        {
          drugId: 'drug-cetirizine',
          batchId: 'batch-cet-001',
          quantity: 10,
          unitPrice: 8.0,
          subtotal: 80.0,
        },
      ],
    },
    {
      saleDate: twoDaysAgo,
      totalAmount: 156.0,
      paymentMethod: 'UPI',
      items: [
        {
          drugId: 'drug-azithromycin',
          batchId: 'batch-azi-001',
          quantity: 3,
          unitPrice: 52.0,
          subtotal: 156.0,
        },
      ],
    },
    {
      saleDate: twoDaysAgo,
      totalAmount: 96.0,
      paymentMethod: 'CARD',
      items: [
        {
          drugId: 'drug-vitamin-d',
          batchId: 'batch-vitd-001',
          quantity: 6,
          unitPrice: 16.0,
          subtotal: 96.0,
        },
      ],
    },
    {
      saleDate: twoDaysAgo,
      totalAmount: 125.0,
      paymentMethod: 'CASH',
      cashReceived: 150.0,
      changeGiven: 25.0,
      items: [
        {
          drugId: 'drug-salbutamol',
          batchId: 'batch-sal-001',
          quantity: 1,
          unitPrice: 125.0,
          subtotal: 125.0,
        },
      ],
    },
    {
      saleDate: twoDaysAgo,
      totalAmount: 50.0,
      paymentMethod: 'UPI',
      items: [
        {
          drugId: 'drug-ibuprofen',
          batchId: 'batch-ibu-001',
          quantity: 5,
          unitPrice: 10.0,
          subtotal: 50.0,
        },
      ],
    },
    {
      saleDate: twoDaysAgo,
      totalAmount: 84.0,
      paymentMethod: 'CASH',
      cashReceived: 100.0,
      changeGiven: 16.0,
      items: [
        {
          drugId: 'drug-losartan',
          batchId: 'batch-los-001',
          quantity: 3,
          unitPrice: 28.0,
          subtotal: 84.0,
        },
      ],
    },
    // Day 2 (yesterday) - 10 sales
    {
      saleDate: yesterday,
      totalAmount: 66.0,
      paymentMethod: 'CASH',
      cashReceived: 100.0,
      changeGiven: 34.0,
      items: [
        {
          drugId: 'drug-omeprazole',
          batchId: 'batch-omez-001',
          quantity: 3,
          unitPrice: 22.0,
          subtotal: 66.0,
        },
      ],
    },
    {
      saleDate: yesterday,
      totalAmount: 54.0,
      paymentMethod: 'UPI',
      items: [
        {
          drugId: 'drug-metformin',
          batchId: 'batch-glyc-001',
          quantity: 3,
          unitPrice: 18.0,
          subtotal: 54.0,
        },
      ],
    },
    {
      saleDate: yesterday,
      totalAmount: 105.0,
      paymentMethod: 'CARD',
      items: [
        {
          drugId: 'drug-atorvastatin',
          batchId: 'batch-ato-001',
          quantity: 3,
          unitPrice: 35.0,
          subtotal: 105.0,
        },
      ],
    },
    {
      saleDate: yesterday,
      totalAmount: 57.0,
      paymentMethod: 'CASH',
      cashReceived: 100.0,
      changeGiven: 43.0,
      items: [
        {
          drugId: 'drug-pantoprazole',
          batchId: 'batch-pan-001',
          quantity: 3,
          unitPrice: 19.0,
          subtotal: 57.0,
        },
      ],
    },
    {
      saleDate: yesterday,
      totalAmount: 72.0,
      paymentMethod: 'UPI',
      items: [
        {
          drugId: 'drug-multivitamin',
          batchId: 'batch-mul-001',
          quantity: 3,
          unitPrice: 24.0,
          subtotal: 72.0,
        },
      ],
    },
    {
      saleDate: yesterday,
      totalAmount: 126.0,
      paymentMethod: 'UPI',
      items: [
        {
          drugId: 'drug-montelukast',
          batchId: 'batch-mon-001',
          quantity: 3,
          unitPrice: 42.0,
          subtotal: 126.0,
        },
      ],
    },
    {
      saleDate: yesterday,
      totalAmount: 66.0,
      paymentMethod: 'CASH',
      cashReceived: 70.0,
      changeGiven: 4.0,
      items: [
        {
          drugId: 'drug-levothyroxine',
          batchId: 'batch-lev-001',
          quantity: 3,
          unitPrice: 22.0,
          subtotal: 66.0,
        },
      ],
    },
    {
      saleDate: yesterday,
      totalAmount: 25.0,
      paymentMethod: 'CASH',
      cashReceived: 50.0,
      changeGiven: 25.0,
      items: [
        {
          drugId: 'drug-aspirin',
          batchId: 'batch-asp-001',
          quantity: 5,
          unitPrice: 5.0,
          subtotal: 25.0,
        },
      ],
    },
    {
      saleDate: yesterday,
      totalAmount: 39.0,
      paymentMethod: 'CARD',
      items: [
        {
          drugId: 'drug-diclofenac',
          batchId: 'batch-dic-001',
          quantity: 3,
          unitPrice: 13.0,
          subtotal: 39.0,
        },
      ],
    },
    {
      saleDate: yesterday,
      totalAmount: 57.0,
      paymentMethod: 'UPI',
      items: [
        {
          drugId: 'drug-calcium',
          batchId: 'batch-cal-001',
          quantity: 3,
          unitPrice: 19.0,
          subtotal: 57.0,
        },
      ],
    },
    // Day 3 (today) - 12 sales
    {
      saleDate: today,
      totalAmount: 144.0,
      paymentMethod: 'UPI',
      items: [
        {
          drugId: 'drug-ciprofloxacin',
          batchId: 'batch-cip-001',
          quantity: 3,
          unitPrice: 48.0,
          subtotal: 144.0,
        },
      ],
    },
    {
      saleDate: today,
      totalAmount: 39.0,
      paymentMethod: 'CASH',
      cashReceived: 50.0,
      changeGiven: 11.0,
      items: [
        {
          drugId: 'drug-ranitidine',
          batchId: 'batch-ran-001',
          quantity: 3,
          unitPrice: 13.0,
          subtotal: 39.0,
        },
      ],
    },
    {
      saleDate: today,
      totalAmount: 75.0,
      paymentMethod: 'CARD',
      items: [
        {
          drugId: 'drug-paracetamol',
          batchId: 'batch-dolo-002',
          quantity: 6,
          unitPrice: 12.5,
          subtotal: 75.0,
        },
      ],
    },
    {
      saleDate: today,
      totalAmount: 40.0,
      paymentMethod: 'CASH',
      cashReceived: 50.0,
      changeGiven: 10.0,
      items: [
        {
          drugId: 'drug-ibuprofen',
          batchId: 'batch-ibu-001',
          quantity: 4,
          unitPrice: 10.0,
          subtotal: 40.0,
        },
      ],
    },
    {
      saleDate: today,
      totalAmount: 76.0,
      paymentMethod: 'UPI',
      items: [
        {
          drugId: 'drug-amoxicillin',
          batchId: 'batch-mox-001',
          quantity: 2,
          unitPrice: 38.0,
          subtotal: 76.0,
        },
      ],
    },
    {
      saleDate: today,
      totalAmount: 48.0,
      paymentMethod: 'CASH',
      cashReceived: 50.0,
      changeGiven: 2.0,
      items: [
        {
          drugId: 'drug-vitamin-d',
          batchId: 'batch-vitd-001',
          quantity: 3,
          unitPrice: 16.0,
          subtotal: 48.0,
        },
      ],
    },
    {
      saleDate: today,
      totalAmount: 56.0,
      paymentMethod: 'UPI',
      items: [
        {
          drugId: 'drug-losartan',
          batchId: 'batch-los-001',
          quantity: 2,
          unitPrice: 28.0,
          subtotal: 56.0,
        },
      ],
    },
    {
      saleDate: today,
      totalAmount: 104.0,
      paymentMethod: 'CARD',
      items: [
        {
          drugId: 'drug-azithromycin',
          batchId: 'batch-azi-001',
          quantity: 2,
          unitPrice: 52.0,
          subtotal: 104.0,
        },
      ],
    },
    {
      saleDate: today,
      totalAmount: 24.0,
      paymentMethod: 'CASH',
      cashReceived: 30.0,
      changeGiven: 6.0,
      items: [
        {
          drugId: 'drug-cetirizine',
          batchId: 'batch-cet-001',
          quantity: 3,
          unitPrice: 8.0,
          subtotal: 24.0,
        },
      ],
    },
    {
      saleDate: today,
      totalAmount: 44.0,
      paymentMethod: 'UPI',
      items: [
        {
          drugId: 'drug-omeprazole',
          batchId: 'batch-omez-001',
          quantity: 2,
          unitPrice: 22.0,
          subtotal: 44.0,
        },
      ],
    },
    {
      saleDate: today,
      totalAmount: 70.0,
      paymentMethod: 'CARD',
      items: [
        {
          drugId: 'drug-atorvastatin',
          batchId: 'batch-ato-001',
          quantity: 2,
          unitPrice: 35.0,
          subtotal: 70.0,
        },
      ],
    },
    {
      saleDate: today,
      totalAmount: 48.0,
      paymentMethod: 'CASH',
      cashReceived: 50.0,
      changeGiven: 2.0,
      items: [
        {
          drugId: 'drug-multivitamin',
          batchId: 'batch-mul-001',
          quantity: 2,
          unitPrice: 24.0,
          subtotal: 48.0,
        },
      ],
    },
  ];

  // Create all sales
  for (const saleData of salesData) {
    await prisma.sale.create({
      data: {
        userId: adminUser.id,
        totalAmount: saleData.totalAmount,
        paymentMethod: saleData.paymentMethod as PaymentMethod,
        cashReceived: saleData.cashReceived,
        changeGiven: saleData.changeGiven,
        status: 'COMPLETED',
        saleDate: saleData.saleDate,
        saleItems: {
          create: saleData.items,
        },
      },
    });
  }

  // Update inventory after all sales
  const inventoryUpdates: { [key: string]: number } = {};
  for (const sale of salesData) {
    for (const item of sale.items) {
      if (!inventoryUpdates[item.batchId]) {
        inventoryUpdates[item.batchId] = 0;
      }
      inventoryUpdates[item.batchId] += item.quantity;
    }
  }

  for (const [batchId, quantity] of Object.entries(inventoryUpdates)) {
    await prisma.inventoryBatch.update({
      where: { id: batchId },
      data: { quantity: { decrement: quantity } },
    });
  }

  console.log(`   ✅ Created ${salesData.length} sales across 3 days`);

  // Create stock alerts
  console.log('\n🔔 Creating stock alerts...');
  await prisma.stockAlert.createMany({
    data: [
      {
        drugId: 'drug-metformin',
        alertType: 'LOW_STOCK',
        message: 'Glycomet stock is running low (150 units remaining)',
        isRead: false,
      },
      {
        drugId: 'drug-amoxicillin',
        alertType: 'EXPIRING_SOON',
        message: 'Mox 500 batch MX-2024-001 expiring in 12 months',
        isRead: false,
      },
    ],
  });
  console.log('   ✅ Created stock alerts');

  // Create system settings
  console.log('\n⚙️ Creating system settings...');
  const settings = [
    { key: 'store_name', value: 'PharmaCare Pharmacy' },
    { key: 'store_address', value: '123 Health Street, Mumbai 400001' },
    { key: 'store_phone', value: '+91-22-12345678' },
    { key: 'store_email', value: 'contact@pharmacare.in' },
    { key: 'gst_number', value: '27XXXXX1234X1ZX' },
    { key: 'currency', value: 'INR' },
    { key: 'low_stock_threshold', value: '20' },
    { key: 'expiry_alert_days', value: '30' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('   ✅ Created system settings');

  console.log('\n✨ Database seeding completed successfully!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Login Credentials:');
  console.log('  Email: ph@gmail.com');
  console.log('  Password: ph@123');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
