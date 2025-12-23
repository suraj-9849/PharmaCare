import { Router } from 'express';
import {
  sendSaleNotification,
  sendLowStockNotification,
  sendExpiryNotification,
} from '../services/firebase.service';

const router: Router = Router();

/**
 * TEMPORARY TEST ROUTE - DELETE AFTER TESTING
 * Test sale notification
 */
router.post('/test-sale-notification', async (req, res) => {
  try {
    console.log('📱 Testing sale notification...');

    const result = await sendSaleNotification({
      saleId: 'TEST-SALE-' + Date.now(),
      totalAmount: 450.0,
      itemCount: 3,
      lowStockItems: ['Paracetamol', 'Ibuprofen'],
    });

    res.json({
      success: true,
      message: 'Sale notification sent!',
      result,
    });
  } catch (error: any) {
    console.error('❌ Error sending sale notification:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * TEMPORARY TEST ROUTE - DELETE AFTER TESTING
 * Test low stock notification
 */
router.post('/test-lowstock-notification', async (req, res) => {
  try {
    console.log('📱 Testing low stock notification...');

    const result = await sendLowStockNotification([
      { name: 'Paracetamol 500mg', quantity: 5 },
      { name: 'Ibuprofen 400mg', quantity: 2 },
      { name: 'Aspirin 75mg', quantity: 0 },
    ]);

    res.json({
      success: true,
      message: 'Low stock notification sent!',
      result,
    });
  } catch (error: any) {
    console.error('❌ Error sending low stock notification:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * TEMPORARY TEST ROUTE - DELETE AFTER TESTING
 * Test expiry notification
 */
router.post('/test-expiry-notification', async (req, res) => {
  try {
    console.log('📱 Testing expiry notification...');

    const result = await sendExpiryNotification([
      {
        drugName: 'Aspirin 75mg',
        batchNumber: 'BATCH-001',
        expiryDate: '2025-01-15',
        daysUntilExpiry: 27,
      },
      {
        drugName: 'Amoxicillin 500mg',
        batchNumber: 'BATCH-002',
        expiryDate: '2025-02-01',
        daysUntilExpiry: 44,
      },
    ]);

    res.json({
      success: true,
      message: 'Expiry notification sent!',
      result,
    });
  } catch (error: any) {
    console.error('❌ Error sending expiry notification:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * TEMPORARY TEST ROUTE - DELETE AFTER TESTING
 * Test all notifications at once
 */
router.post('/test-all-notifications', async (req, res) => {
  try {
    console.log('📱 Testing all notifications...');

    const results = await Promise.allSettled([
      sendSaleNotification({
        saleId: 'TEST-SALE-' + Date.now(),
        totalAmount: 450.0,
        itemCount: 3,
        lowStockItems: ['Paracetamol'],
      }),
      sendLowStockNotification([
        { name: 'Paracetamol 500mg', quantity: 5 },
        { name: 'Aspirin 75mg', quantity: 0 },
      ]),
      sendExpiryNotification([
        {
          drugName: 'Aspirin 75mg',
          batchNumber: 'BATCH-001',
          expiryDate: '2025-01-15',
          daysUntilExpiry: 27,
        },
      ]),
    ]);

    res.json({
      success: true,
      message: 'All test notifications sent!',
      results: results.map((r, i) => ({
        type: ['sale', 'lowStock', 'expiry'][i],
        status: r.status,
        result: r.status === 'fulfilled' ? r.value : r.reason,
      })),
    });
  } catch (error: any) {
    console.error('❌ Error sending notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
