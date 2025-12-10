import { Router, Request, Response } from 'express';
import multer from 'multer';
import { InvoiceService } from '../services/invoice.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();
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
 * @desc    Extract data from invoice image using Gemini 3 Pro
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

      // Extract data using Gemini 3 Pro
      const extractedData = await invoiceService.extractInvoiceData(
        req.file.buffer,
        req.file.mimetype
      );

      return successResponse(
        res,
        extractedData,
        'Invoice data extracted successfully. Please review and verify before saving.',
        200
      );
    } catch (error) {
      console.error('Invoice extraction error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process invoice';
      return errorResponse(res, errorMessage, 500);
    }
  }
);

/**
 * @route   POST /api/invoices/process
 * @desc    Save verified invoice data to database
 * @access  Private (requires authentication)
 */
router.post('/process', authenticate, async (req: Request, res: Response) => {
  try {
    const { extractedData } = req.body;
    const userId = req.user!.id;

    if (!extractedData || !extractedData.items || extractedData.items.length === 0) {
      return errorResponse(res, 'Invalid invoice data provided', 400);
    }

    console.log('Processing invoice with', extractedData.items.length, 'items');

    // Process and save to database
    const result = await invoiceService.processInvoice(extractedData, userId);

    return successResponse(
      res,
      result,
      `Successfully processed ${result.totalItems} items from invoice. ` +
        `${result.newDrugsCreated.length} new drugs added, ${result.matchedDrugsCount} existing drugs updated.`,
      201
    );
  } catch (error) {
    console.error('Invoice processing error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to save invoice data';
    return errorResponse(res, errorMessage, 500);
  }
});

/**
 * @route   GET /api/invoices/test
 * @desc    Test endpoint to verify route is working
 * @access  Private
 */
router.get('/test', authenticate, (req: Request, res: Response) => {
  return successResponse(
    res,
    { message: 'Invoice routes are working!' },
    'Test successful'
  );
});

export default router;
