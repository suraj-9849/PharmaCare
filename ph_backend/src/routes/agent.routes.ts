import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';
import multer from 'multer';

const router: Router = Router();

// Python agent service URL (same as chatbot - combined server)
const AGENT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL || 'http://localhost:8000';

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/agent/health
 * Check agent service health
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${AGENT_SERVICE_URL}/agent/health`);
    const data = await response.json();
    return successResponse(res, data, 'Agent service is healthy');
  } catch (_error) {
    return errorResponse(res, 'Agent service is unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/agent/chat
 * Send message to agent and get response
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return errorResponse(res, 'Message is required', HTTP_STATUS.BAD_REQUEST);
    }

    const response = await fetch(`${AGENT_SERVICE_URL}/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new Error(errorData.detail || 'Agent service error');
    }

    const data = await response.json();
    return successResponse(res, data, 'Agent response generated');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/agent/refined-chat
 * Send message to refined agent and get response
 */
router.post('/refined-chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return errorResponse(res, 'Message is required', HTTP_STATUS.BAD_REQUEST);
    }

    const response = await fetch(`${AGENT_SERVICE_URL}/agent/refined-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new Error(errorData.detail || 'Agent service error');
    }

    const data = await response.json();
    return successResponse(res, data, 'Agent response generated');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/agent/inventory
 * Get current inventory from agent service
 */
router.get('/inventory', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${AGENT_SERVICE_URL}/agent/inventory`);

    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }

    const data = await response.json();
    return successResponse(res, data, 'Inventory fetched successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/agent/upload-inventory
 * Upload Excel file to update inventory
 */
router.post('/upload-inventory', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', HTTP_STATUS.BAD_REQUEST);
    }

    // Create FormData and send to Python service
    const formData = new FormData();
    const blob = new Blob([Buffer.from(req.file.buffer)], { type: req.file.mimetype });
    formData.append('file', blob, req.file.originalname);

    const response = await fetch(`${AGENT_SERVICE_URL}/agent/upload-inventory`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new Error(errorData.detail || 'Failed to upload inventory');
    }

    const data = await response.json();
    return successResponse(res, data, 'Inventory uploaded successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/agent/clear
 * Clear agent chat history (client-side managed)
 */
router.post('/clear', async (_req: Request, res: Response) => {
  try {
    return successResponse(res, { cleared: true }, 'Agent chat history cleared');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default router;
