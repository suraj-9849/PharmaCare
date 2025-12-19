import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import multer from 'multer';
import { PrescriptionService } from '../services/prescription.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';

const router: RouterType = Router();
const prescriptionService = new PrescriptionService();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpg, jpeg, png, webp, gif)'));
    }
  },
});

/**
 * @route   POST /api/prescriptions/scan
 * @desc    Extract medications from prescription image using Gemini 3 Pro
 * @access  Private (requires authentication)
 */
router.post(
  '/scan',
  authenticate,
  upload.single('prescription'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return errorResponse(res, 'No prescription image provided', 400);
      }

      console.log('Scanning prescription image:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });

      // Extract prescription data using Gemini 3 Pro
      const extractedData = await prescriptionService.extractPrescriptionData(
        req.file.buffer,
        req.file.mimetype
      );

      return successResponse(
        res,
        extractedData,
        'Prescription scanned successfully. Extracted ' +
          extractedData.medications.length +
          ' medications.',
        200
      );
    } catch (error) {
      console.error('Prescription scan error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to scan prescription';
      return errorResponse(res, errorMessage, 500);
    }
  }
);

/**
 * @route   POST /api/prescriptions/check-availability
 * @desc    Check availability of prescribed medications in inventory
 * @access  Private (requires authentication)
 */
router.post('/check-availability', authenticate, async (req: Request, res: Response) => {
  try {
    const { medications } = req.body;

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return errorResponse(res, 'No medications provided', 400);
    }

    console.log('Checking availability for', medications.length, 'medications');

    // Check availability using Gemini 3 Pro for smart matching
    const availabilityResults = await prescriptionService.checkAvailability(medications);

    // Count statuses
    const inStock = availabilityResults.filter((r) => r.status === 'IN_STOCK').length;
    const lowStock = availabilityResults.filter((r) => r.status === 'LOW_STOCK').length;
    const outOfStock = availabilityResults.filter((r) => r.status === 'OUT_OF_STOCK').length;

    return successResponse(
      res,
      {
        results: availabilityResults,
        summary: {
          total: medications.length,
          inStock,
          lowStock,
          outOfStock,
        },
      },
      `Availability checked: ${inStock} in stock, ${lowStock} low stock, ${outOfStock} out of stock`,
      200
    );
  } catch (error) {
    console.error('Availability check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to check availability';
    return errorResponse(res, errorMessage, 500);
  }
});

/**
 * @route   POST /api/prescriptions/purchase
 * @desc    Process prescription purchase and automatically reduce stock
 * @access  Private (requires authentication)
 */
router.post('/purchase', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      prescriptionData,
      availabilityResults,
      paymentMethod,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
    } = req.body;
    const userId = req.user!.id;

    // Validate inputs
    if (!prescriptionData || !availabilityResults || !paymentMethod) {
      return errorResponse(
        res,
        'Missing required fields: prescriptionData, availabilityResults, paymentMethod',
        400
      );
    }

    if (!['CASH', 'CARD', 'UPI', 'CREDIT'].includes(paymentMethod.toUpperCase())) {
      return errorResponse(
        res,
        'Invalid payment method. Must be one of: CASH, CARD, UPI, CREDIT',
        400
      );
    }

    // Validate at least customer name is provided
    if (!customerId && !customerName) {
      return errorResponse(res, 'Either customerId or customerName must be provided', 400);
    }

    console.log('Processing prescription purchase with', availabilityResults.length, 'items');

    // Process purchase and reduce stock
    const result = await prescriptionService.processPurchase(
      prescriptionData,
      availabilityResults,
      paymentMethod.toUpperCase() as 'CASH' | 'CARD' | 'UPI' | 'CREDIT',
      userId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress
    );

    return successResponse(
      res,
      result,
      `Purchase completed successfully! Processed ${result.itemsProcessed} items. Total: ₹${result.totalAmount.toFixed(2)}. Stock automatically updated.`,
      201
    );
  } catch (error) {
    console.error('Purchase processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process purchase';
    return errorResponse(res, errorMessage, 500);
  }
});

/**
 * @route   GET /api/prescriptions/test
 * @desc    Test endpoint to verify route is working
 * @access  Private
 */
router.get('/test', authenticate, (req: Request, res: Response) => {
  return successResponse(res, { message: 'Prescription routes are working!' }, 'Test successful');
});

export default router;
