"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const helpers_1 = require("./utils/helpers");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Starting database seeding...\n');
    // Create Admin User (ph@gmail.com / ph@123)
    console.log('👤 Creating admin user...');
    const hashedPassword = await (0, helpers_1.hashPassword)('ph@123');
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
    // Create sample sales
    console.log('\n💰 Creating sample sales...');
    void (await prisma.sale.create({
        data: {
            userId: adminUser.id,
            totalAmount: 50.0,
            paymentMethod: 'CASH',
            cashReceived: 100.0,
            changeGiven: 50.0,
            status: 'COMPLETED',
            saleItems: {
                create: [
                    {
                        drugId: 'drug-paracetamol',
                        batchId: 'batch-dolo-001',
                        quantity: 4,
                        unitPrice: 12.5,
                        subtotal: 50.0,
                    },
                ],
            },
        },
    }));
    void (await prisma.sale.create({
        data: {
            userId: adminUser.id,
            totalAmount: 114.0,
            paymentMethod: 'UPI',
            status: 'COMPLETED',
            saleItems: {
                create: [
                    {
                        drugId: 'drug-amoxicillin',
                        batchId: 'batch-mox-001',
                        quantity: 3,
                        unitPrice: 38.0,
                        subtotal: 114.0,
                    },
                ],
            },
        },
    }));
    // Update inventory after sales
    await prisma.inventoryBatch.update({
        where: { id: 'batch-dolo-001' },
        data: { quantity: { decrement: 4 } },
    });
    await prisma.inventoryBatch.update({
        where: { id: 'batch-mox-001' },
        data: { quantity: { decrement: 3 } },
    });
    console.log(`   ✅ Created 2 sample sales`);
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
//# sourceMappingURL=seed.js.map