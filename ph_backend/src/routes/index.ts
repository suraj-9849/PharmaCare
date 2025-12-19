import { Router, type Router as ExpressRouter } from 'express';
import authRoutes from './auth.routes';
import drugRoutes from './drug.routes';
import inventoryRoutes from './inventory.routes';
import saleRoutes from './sale.routes';
import supplierRoutes from './supplier.routes';
import customerRoutes from './customer.routes';
import dashboardRoutes from './dashboard.routes';
import paymentRoutes from './payment.routes';
import chatbotRoutes from './chatbot.routes';
import agentRoutes from './agent.routes';
import invoiceRoutes from './invoice.routes';
import prescriptionRoutes from './prescription.routes';
import prescriptionHistoryRoutes from './prescription-history.routes';
import alertRoutes from './alert.routes';
import reorderRoutes from './reorder.routes';
import smartShelfRoutes from './smart-shelf.routes';
import notificationRoutes from './notification.routes';
// TEMPORARY - DELETE AFTER TESTING
import testNotificationRoutes from './test-notifications.routes';

const router: ExpressRouter = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/drugs', drugRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', saleRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/customers', customerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/payments', paymentRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/agent', agentRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/prescription-histories', prescriptionHistoryRoutes);
router.use('/alerts', alertRoutes);
router.use('/reorders', reorderRoutes);
router.use('/smart-shelf', smartShelfRoutes);
router.use('/notifications', notificationRoutes);
// TEMPORARY - DELETE AFTER TESTING
router.use('/test-notifications', testNotificationRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
