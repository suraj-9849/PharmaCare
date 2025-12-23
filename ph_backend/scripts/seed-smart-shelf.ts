/**
 * Smart Shelf Test Data Seeder
 * Run with: npx ts-node scripts/seed-smart-shelf.ts
 */

import prisma from '../src/config/database';

async function seedSmartShelf() {
  console.log('🌱 Seeding Smart Shelf test data...\n');

  try {
    // 0. Cleanup existing data
    console.log('🧹 Cleaning up existing smart shelf data...');
    await prisma.incorrectPickAlert.deleteMany({});
    await prisma.inventoryBatch.deleteMany({
      where: {
        shelfLocationId: { not: null }
      }
    });
    await prisma.shelfLocation.deleteMany({});
    console.log('✓ Cleanup complete\n');

    // 1. Create Shelf Locations
    console.log('📦 Creating shelf locations...');

    const shelfA1 = await prisma.shelfLocation.create({
      data: {
        shelfCode: 'A1',
        shelfName: 'General Medicine Shelf',
        row: '3',
        column: '5',
        zone: 'General',
        capacity: 15,
        status: 'ACTIVE',
        qrCode: 'QR-SHELF-A1',
        notes: 'Primary storage for general medications',
      },
    });
    console.log(`✓ Created shelf: ${shelfA1.shelfCode} (${shelfA1.id})`);

    const shelfB2 = await prisma.shelfLocation.create({
      data: {
        shelfCode: 'B2',
        shelfName: 'Antibiotics Shelf',
        row: '3',
        column: '4',
        zone: 'General',
        capacity: 12,
        status: 'ACTIVE',
        qrCode: 'QR-SHELF-B2',
        notes: 'Antibiotic medications',
      },
    });
    console.log(`✓ Created shelf: ${shelfB2.shelfCode} (${shelfB2.id})`);

    const shelfC3 = await prisma.shelfLocation.create({
      data: {
        shelfCode: 'C3',
        shelfName: 'Cardiovascular Shelf',
        row: '3',
        column: '5',
        zone: 'General',
        capacity: 15,
        status: 'ACTIVE',
        qrCode: 'QR-SHELF-C3',
        notes: 'Cardiovascular medications',
      },
    });
    console.log(`✓ Created shelf: ${shelfC3.shelfCode} (${shelfC3.id})`);

    const shelfD4 = await prisma.shelfLocation.create({
      data: {
        shelfCode: 'D4',
        shelfName: 'Refrigerated Medications',
        row: '2',
        column: '6',
        zone: 'Refrigerated',
        capacity: 12,
        status: 'ACTIVE',
        qrCode: 'QR-SHELF-D4',
        notes: 'Temperature controlled storage 2-8°C',
      },
    });
    console.log(`✓ Created shelf: ${shelfD4.shelfCode} (${shelfD4.id})\n`);

    // 2. Get existing drugs and suppliers
    console.log('🔍 Finding existing drugs and suppliers...');
    const drugs = await prisma.drug.findMany({ take: 15 });
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

    // Helper function to create a batch
    const createBatch = async (drugIndex: number, shelfId: string, slotPos: number, queuePos: number, daysToExpiry: number, batchSuffix: string) => {
      const drugIdx = drugIndex % drugs.length;
      const supplierIdx = drugIndex % suppliers.length;

      return await prisma.inventoryBatch.create({
        data: {
          drugId: drugs[drugIdx].id,
          batchNumber: `B${String(Math.floor(1000 + Math.random() * 9000))}`,
          quantity: Math.floor(50 + Math.random() * 100),
          purchasePrice: 10.00 + Math.random() * 40,
          sellPrice: 20.00 + Math.random() * 80,
          expiryDate: new Date(today.getTime() + daysToExpiry * 24 * 60 * 60 * 1000),
          supplierId: suppliers[supplierIdx].id,
          location: `Shelf ${batchSuffix}`,
          shelfLocationId: shelfId,
          slotPosition: slotPos,
          queuePosition: queuePos,
        },
      });
    };

    // Shelf A1 - 12 batches (3 rows x 5 columns = 15, filling 12)
    const expiryDaysA1 = [-5, -2, 3, 5, 10, 12, 20, 25, 45, 60, 90, 120];
    for (let i = 0; i < 12; i++) {
      const batch = await createBatch(i, shelfA1.id, i + 1, i, expiryDaysA1[i], shelfA1.shelfCode);
      batches.push(batch);
      console.log(`✓ Batch ${batch.batchNumber} - Shelf ${shelfA1.shelfCode}, Slot ${i + 1}, Expires in ${expiryDaysA1[i]} days`);
    }

    // Shelf B2 - 9 batches (3 rows x 4 columns = 12, filling 9)
    const expiryDaysB2 = [3, 8, 15, 22, 30, 50, 70, 100, 150];
    for (let i = 0; i < 9; i++) {
      const batch = await createBatch(i, shelfB2.id, i + 1, i, expiryDaysB2[i], shelfB2.shelfCode);
      batches.push(batch);
      console.log(`✓ Batch ${batch.batchNumber} - Shelf ${shelfB2.shelfCode}, Slot ${i + 1}, Expires in ${expiryDaysB2[i]} days`);
    }

    // Shelf C3 - 14 batches (3 rows x 5 columns = 15, filling 14)
    const expiryDaysC3 = [-3, 2, 4, 7, 11, 18, 24, 28, 40, 65, 85, 110, 140, 180];
    for (let i = 0; i < 14; i++) {
      const batch = await createBatch(i, shelfC3.id, i + 1, i, expiryDaysC3[i], shelfC3.shelfCode);
      batches.push(batch);
      console.log(`✓ Batch ${batch.batchNumber} - Shelf ${shelfC3.shelfCode}, Slot ${i + 1}, Expires in ${expiryDaysC3[i]} days`);
    }

    // Shelf D4 - 6 batches (2 rows x 6 columns = 12, filling 6)
    const expiryDaysD4 = [10, 20, 35, 60, 90, 120];
    for (let i = 0; i < 6; i++) {
      const batch = await createBatch(i, shelfD4.id, i + 1, i, expiryDaysD4[i], shelfD4.shelfCode);
      batches.push(batch);
      console.log(`✓ Batch ${batch.batchNumber} - Shelf ${shelfD4.shelfCode}, Slot ${i + 1}, Expires in ${expiryDaysD4[i]} days`);
    }

    console.log(`\n✓ Created ${batches.length} total batches\n`);

    // 4. Create a sample incorrect pick alert
    console.log('⚠️  Creating sample incorrect pick alert...');
    if (batches.length >= 2) {
      const alert = await prisma.incorrectPickAlert.create({
        data: {
          shelfLocationId: shelfA1.id,
          batchIdPicked: batches[1].id, // They picked batch at position 1
          batchIdExpected: batches[0].id, // Should have picked batch at position 0
          pickedBy: null,
          acknowledged: false,
        },
      });
      console.log(`✓ Created alert: Expected ${batches[0].batchNumber}, but picked ${batches[1].batchNumber}\n`);
    }

    // 5. Summary
    console.log('📊 Smart Shelf Test Data Summary:');
    console.log('================================');
    console.log(`✓ Shelves created: 4`);
    console.log(`  - ${shelfA1.shelfCode}: ${shelfA1.shelfName} (Capacity: ${shelfA1.capacity}, Zone: ${shelfA1.zone})`);
    console.log(`  - ${shelfB2.shelfCode}: ${shelfB2.shelfName} (Capacity: ${shelfB2.capacity}, Zone: ${shelfB2.zone})`);
    console.log(`  - ${shelfC3.shelfCode}: ${shelfC3.shelfName} (Capacity: ${shelfC3.capacity}, Zone: ${shelfC3.zone})`);
    console.log(`  - ${shelfD4.shelfCode}: ${shelfD4.shelfName} (Capacity: ${shelfD4.capacity}, Zone: ${shelfD4.zone})`);
    console.log(`\n✓ Batches created: ${batches.length}`);
    console.log(`  - Shelf A1: 12 batches (80% utilization)`);
    console.log(`  - Shelf B2: 9 batches (75% utilization)`);
    console.log(`  - Shelf C3: 14 batches (93% utilization)`);
    console.log(`  - Shelf D4: 6 batches (50% utilization)`);
    console.log(`\n✓ Incorrect pick alerts: 1`);
    console.log('\n✅ Smart Shelf test data seeded successfully!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Start the backend: npm run dev (in ph_backend)');
    console.log('2. Start the frontend: npm run dev (in ph_frontend)');
    console.log('3. Navigate to: http://localhost:3000/dashboard/smart-shelf');
    console.log('4. View shelves with real data');
    console.log('5. Click on slots to see batch details');
    console.log('6. Test the FEFO Swipe interface for expiring items\n');

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
