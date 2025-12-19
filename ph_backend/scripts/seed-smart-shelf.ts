/**
 * Smart Shelf Test Data Seeder
 * Run with: npx ts-node scripts/seed-smart-shelf.ts
 */

import prisma from '../src/config/database';

async function seedSmartShelf() {
  console.log('🌱 Seeding Smart Shelf test data...\n');

  try {
    // 1. Create Shelf Locations
    console.log('📦 Creating shelf locations...');

    const shelfA1 = await prisma.shelfLocation.create({
      data: {
        shelfCode: 'A1',
        shelfName: 'Main Pharmacy Shelf A',
        row: '1',
        column: 'A',
        zone: 'General',
        capacity: 50,
        status: 'ACTIVE',
        qrCode: 'QR-SHELF-A1',
        notes: 'Primary storage for general medications',
      },
    });
    console.log(`✓ Created shelf: ${shelfA1.shelfCode} (${shelfA1.id})`);

    const shelfB2 = await prisma.shelfLocation.create({
      data: {
        shelfCode: 'B2',
        shelfName: 'Refrigerated Shelf B',
        row: '2',
        column: 'B',
        zone: 'Refrigerated',
        capacity: 30,
        status: 'ACTIVE',
        qrCode: 'QR-SHELF-B2',
        notes: 'Temperature controlled storage 2-8°C',
      },
    });
    console.log(`✓ Created shelf: ${shelfB2.shelfCode} (${shelfB2.id})`);

    const shelfC3 = await prisma.shelfLocation.create({
      data: {
        shelfCode: 'C3',
        shelfName: 'Controlled Substances Shelf',
        row: '3',
        column: 'C',
        zone: 'Controlled',
        capacity: 100,
        status: 'ACTIVE',
        qrCode: 'QR-SHELF-C3',
        notes: 'Locked cabinet for controlled medications',
      },
    });
    console.log(`✓ Created shelf: ${shelfC3.shelfCode} (${shelfC3.id})`);

    const shelfD4 = await prisma.shelfLocation.create({
      data: {
        shelfCode: 'D4',
        shelfName: 'Hazardous Materials Shelf',
        row: '4',
        column: 'D',
        zone: 'Hazardous',
        capacity: 25,
        status: 'ACTIVE',
        qrCode: 'QR-SHELF-D4',
        notes: 'Special handling required',
      },
    });
    console.log(`✓ Created shelf: ${shelfD4.shelfCode} (${shelfD4.id})\n`);

    // 2. Get existing drugs and suppliers
    console.log('🔍 Finding existing drugs and suppliers...');
    const drugs = await prisma.drug.findMany({ take: 5 });
    const suppliers = await prisma.supplier.findMany({ take: 3 });

    if (drugs.length === 0) {
      console.log('❌ No drugs found. Please create drugs first.');
      return;
    }

    if (suppliers.length === 0) {
      console.log('❌ No suppliers found. Please create suppliers first.');
      return;
    }

    console.log(`✓ Found ${drugs.length} drugs and ${suppliers.length} suppliers\n`);

    // 3. Create Inventory Batches with various expiry dates
    console.log('📋 Creating inventory batches with expiry dates...');

    const today = new Date();
    const batches = [];

    // Batch 1: Expiring in 5 days (URGENT)
    const batch1 = await prisma.inventoryBatch.create({
      data: {
        drugId: drugs[0].id,
        batchNumber: 'BATCH-URGENT-001',
        quantity: 50,
        purchasePrice: 25.00,
        sellPrice: 50.00,
        expiryDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        supplierId: suppliers[0].id,
        location: 'Warehouse A',
        shelfLocationId: shelfA1.id,
        queuePosition: 0, // Front of queue
      },
    });
    batches.push(batch1);
    console.log(`✓ Created batch: ${batch1.batchNumber} - Expires in 5 days (Shelf ${shelfA1.shelfCode}, Position 0)`);

    // Batch 2: Expiring in 10 days (CRITICAL)
    const batch2 = await prisma.inventoryBatch.create({
      data: {
        drugId: drugs[0].id,
        batchNumber: 'BATCH-CRITICAL-002',
        quantity: 75,
        purchasePrice: 30.00,
        sellPrice: 60.00,
        expiryDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
        supplierId: suppliers[0].id,
        location: 'Warehouse A',
        shelfLocationId: shelfA1.id,
        queuePosition: 1, // Second in queue
      },
    });
    batches.push(batch2);
    console.log(`✓ Created batch: ${batch2.batchNumber} - Expires in 10 days (Shelf ${shelfA1.shelfCode}, Position 1)`);

    // Batch 3: Expiring in 20 days
    const batch3 = await prisma.inventoryBatch.create({
      data: {
        drugId: drugs[1].id,
        batchNumber: 'BATCH-SOON-003',
        quantity: 100,
        purchasePrice: 40.00,
        sellPrice: 80.00,
        expiryDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000),
        supplierId: suppliers[1].id,
        location: 'Warehouse B',
        shelfLocationId: shelfB2.id,
        queuePosition: 0,
      },
    });
    batches.push(batch3);
    console.log(`✓ Created batch: ${batch3.batchNumber} - Expires in 20 days (Shelf ${shelfB2.shelfCode}, Position 0)`);

    // Batch 4: Expiring in 25 days
    const batch4 = await prisma.inventoryBatch.create({
      data: {
        drugId: drugs[2].id,
        batchNumber: 'BATCH-MODERATE-004',
        quantity: 120,
        purchasePrice: 35.00,
        sellPrice: 70.00,
        expiryDate: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000),
        supplierId: suppliers[1].id,
        location: 'Warehouse C',
        shelfLocationId: shelfC3.id,
        queuePosition: 0,
      },
    });
    batches.push(batch4);
    console.log(`✓ Created batch: ${batch4.batchNumber} - Expires in 25 days (Shelf ${shelfC3.shelfCode}, Position 0)`);

    // Batch 5: Good stock (90 days)
    const batch5 = await prisma.inventoryBatch.create({
      data: {
        drugId: drugs[3].id,
        batchNumber: 'BATCH-GOOD-005',
        quantity: 200,
        purchasePrice: 50.00,
        sellPrice: 100.00,
        expiryDate: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
        supplierId: suppliers[2].id,
        location: 'Warehouse D',
        shelfLocationId: shelfA1.id,
        queuePosition: 2, // Third in queue
      },
    });
    batches.push(batch5);
    console.log(`✓ Created batch: ${batch5.batchNumber} - Expires in 90 days (Shelf ${shelfA1.shelfCode}, Position 2)`);

    // Batch 6: Another good stock batch
    const batch6 = await prisma.inventoryBatch.create({
      data: {
        drugId: drugs[4].id,
        batchNumber: 'BATCH-GOOD-006',
        quantity: 150,
        purchasePrice: 45.00,
        sellPrice: 90.00,
        expiryDate: new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000),
        supplierId: suppliers[2].id,
        location: 'Warehouse E',
        shelfLocationId: shelfD4.id,
        queuePosition: 0,
      },
    });
    batches.push(batch6);
    console.log(`✓ Created batch: ${batch6.batchNumber} - Expires in 120 days (Shelf ${shelfD4.shelfCode}, Position 0)\n`);

    // 4. Create a sample incorrect pick alert
    console.log('⚠️  Creating sample incorrect pick alert...');
    const alert = await prisma.incorrectPickAlert.create({
      data: {
        shelfLocationId: shelfA1.id,
        batchIdPicked: batch2.id, // They picked batch at position 1
        batchIdExpected: batch1.id, // Should have picked batch at position 0
        pickedBy: null,
        acknowledged: false,
      },
    });
    console.log(`✓ Created alert: Expected ${batch1.batchNumber}, but picked ${batch2.batchNumber}\n`);

    // 5. Summary
    console.log('📊 Smart Shelf Test Data Summary:');
    console.log('================================');
    console.log(`✓ Shelves created: 4`);
    console.log(`  - ${shelfA1.shelfCode} (General, Capacity: 50)`);
    console.log(`  - ${shelfB2.shelfCode} (Refrigerated, Capacity: 30)`);
    console.log(`  - ${shelfC3.shelfCode} (Controlled, Capacity: 100)`);
    console.log(`  - ${shelfD4.shelfCode} (Hazardous, Capacity: 25)`);
    console.log(`\n✓ Batches created: 6`);
    console.log(`  - 2 expiring within 15 days (urgent)`);
    console.log(`  - 2 expiring within 30 days`);
    console.log(`  - 2 good stock (90+ days)`);
    console.log(`\n✓ Incorrect pick alerts: 1`);
    console.log('\n✅ Smart Shelf test data seeded successfully!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Start the frontend: npm run dev (in ph_frontend)');
    console.log('2. Navigate to: http://localhost:3000/dashboard/smart-shelf');
    console.log('3. Test the FEFO Swipe interface');
    console.log('4. Review the Shelf Map');
    console.log('5. Check the Alerts tab\n');

  } catch (error) {
    console.error('❌ Error seeding smart shelf data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedSmartShelf()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
