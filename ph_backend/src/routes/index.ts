import { Router, type Router as ExpressRouter } from 'express';
import authRoutes from './auth.routes';
import drugRoutes from './drug.routes';
import inventoryRoutes from './inventory.routes';
import saleRoutes from './sale.routes';
import supplierRoutes from './supplier.routes';
import customerRoutes from './customer.routes';
import dashboardRoutes from './dashboard.routes';
import paymentRoutes from './payment.routes';
import invoiceRoutes from './invoice.routes';
import prescriptionRoutes from './prescription.routes';
import alertRoutes from './alert.routes';

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
router.use('/invoices', invoiceRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/alerts', alertRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
