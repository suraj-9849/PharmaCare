import { sendSaleNotification, sendLowStockNotification, initializeFirebase } from './src/services/firebase.service';

/**
 * Test script for Firebase Cloud Messaging
 * Run with: npx ts-node test-firebase.ts
 */

async function testFirebaseNotifications() {
  console.log('🧪 Testing Firebase Cloud Messaging...\n');

  try {
    // Initialize Firebase
    console.log('1️⃣ Initializing Firebase Admin SDK...');
    initializeFirebase();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 1: Send sale notification
    console.log('\n2️⃣ Testing Sale Notification...');
    const saleResult = await sendSaleNotification({
      saleId: 'TEST-SALE-001',
      totalAmount: 450.0,
      itemCount: 3,
      lowStockItems: ['Paracetamol', 'Ibuprofen'],
    });

    if (saleResult.success) {
      console.log('✅ Sale notification sent successfully!');
      console.log(`   Message ID: ${saleResult.messageId}`);
    } else {
      console.log('❌ Sale notification failed:', saleResult.error);
    }

    // Wait a bit before next test
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 2: Send low stock notification
    console.log('\n3️⃣ Testing Low Stock Notification...');
    const lowStockResult = await sendLowStockNotification([
      { name: 'Paracetamol 500mg', quantity: 5 },
      { name: 'Ibuprofen 400mg', quantity: 2 },
      { name: 'Aspirin 75mg', quantity: 0 },
    ]);

    if (lowStockResult.success) {
      console.log('✅ Low stock notification sent successfully!');
      console.log(`   Message ID: ${lowStockResult.messageId}`);
    } else {
      console.log('❌ Low stock notification failed:', lowStockResult.error);
    }

    console.log('\n✅ All tests completed!');
    console.log('\n📱 Check your Flutter app for notifications');
    console.log('   - Open the app or check notification tray');
    console.log('   - You should see 2 notifications');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testFirebaseNotifications();
