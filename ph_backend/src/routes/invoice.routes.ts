import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import multer from 'multer';
import { InvoiceService } from '../services/invoice.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';

const router: RouterType = Router();
const invoiceService = new InvoiceService();

// Configure multer for memory storage (stores file in memory as Buffer)
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
 * @route   POST /api/invoices/extract
 * @desc    Extract data from invoice image using OpenAI GPT-4o-mini
 * @access  Private (requires authentication)
 */
router.post(
  '/extract',
  authenticate,
  upload.single('invoice'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return errorResponse(res, 'No invoice image provided', 400);
      }

      console.log('Processing invoice image:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });

      // Extract data using OpenAI GPT-4o-mini
      const extractedData = await invoiceService.extractInvoiceData(
        req.file.buffer,
        req.file.mimetype
      );

      // Validate extracted items
      const validation = invoiceService.validateInvoiceItems(extractedData);

      return successResponse(
        res,
        {
          extractedData,
          validation,
        },
        'Invoice data extracted successfully. Please review and verify before saving.',
        200
      );
    } catch (error) {
      console.error('Invoice extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process invoice';
      return errorResponse(res, errorMessage, 500);
    }
  }
);

/**
 * @route   POST /api/invoices/validate
 * @desc    Validate invoice items for missing required fields
 * @access  Private (requires authentication)
 */
router.post('/validate', authenticate, async (req: Request, res: Response) => {
  try {
    const { extractedData } = req.body;

    if (!extractedData || !extractedData.items) {
      return errorResponse(res, 'Invalid invoice data provided', 400);
    }

    const validation = invoiceService.validateInvoiceItems(extractedData);

    return successResponse(
      res,
      validation,
      validation.isValid
        ? 'All items have required fields'
        : `${validation.missingFieldsInfo.itemsWithMissingFields.length} items have missing fields`,
      200
    );
  } catch (error) {
    console.error('Validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate invoice';
    return errorResponse(res, errorMessage, 500);
  }
});

/**
 * @route   POST /api/invoices/drugs/create
 * @desc    Create a new drug from invoice item
 * @access  Private (requires authentication)
 */
router.post('/drugs/create', authenticate, async (req: Request, res: Response) => {
  try {
    const drugData = req.body;

    // Validate required fields for new drug
    if (
      !drugData.brandName ||
      !drugData.genericName ||
      !drugData.category ||
      !drugData.manufacturer
    ) {
      return errorResponse(
        res,
        'Missing required fields: brandName, genericName, category, manufacturer',
        400
      );
    }

    const newDrug = await invoiceService.createNewDrug({
      brandName: drugData.brandName,
      genericName: drugData.genericName,
      category: drugData.category,
      manufacturer: drugData.manufacturer,
      dosage: drugData.dosage || null,
      chemicalName: drugData.chemicalName || null,
      requiresPrescription: drugData.requiresPrescription || false,
      reorderLevel: drugData.reorderLevel || 20,
    });

    return successResponse(res, newDrug, 'New drug created successfully', 201);
  } catch (error) {
    console.error('Drug creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create drug';
    return errorResponse(res, errorMessage, 500);
  }
});

/**
 * @route   POST /api/invoices/process
 * @desc    Save verified invoice data to database (only validated items)
 * @access  Private (requires authentication)
 */
router.post('/process', authenticate, async (req: Request, res: Response) => {
  try {
    const { extractedData, updatedItems } = req.body;
    const userId = req.user!.id;

    if (!extractedData || !extractedData.items || extractedData.items.length === 0) {
      return errorResponse(res, 'Invalid invoice data provided', 400);
    }

    console.log('Processing invoice with', extractedData.items.length, 'items');

    // Process and save to database
    const result = await invoiceService.processInvoice(extractedData, userId, updatedItems);

    const message =
      result.skippedItems.length > 0
        ? `Processed ${result.totalItemsProcessed} items successfully. ${result.skippedItems.length} items skipped (new drugs need to be created first).`
        : `Successfully processed all ${result.totalItemsProcessed} items from invoice.`;

    return successResponse(res, result, message, 201);
  } catch (error) {
    console.error('Invoice processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save invoice data';
    return errorResponse(res, errorMessage, 500);
  }
});

/**
 * @route   GET /api/invoices/test
 * @desc    Test endpoint to verify route is working
 * @access  Private
 */
router.get('/test', authenticate, (req: Request, res: Response) => {
  return successResponse(res, { message: 'Invoice routes are working!' }, 'Test successful');
});

export default router;
