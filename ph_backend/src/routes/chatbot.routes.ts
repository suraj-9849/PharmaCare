import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

const router: Router = Router();

// Python chatbot service URL
const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL || 'http://localhost:8000';

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/chatbot/health
 * Check chatbot service health
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${CHATBOT_SERVICE_URL}/health`);
    const data = await response.json();
    return successResponse(res, data, 'Chatbot service is healthy');
  } catch (_error) {
    return errorResponse(res, 'Chatbot service is unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/chatbot/chat
 * Send message to chatbot and get response
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return errorResponse(res, 'Message is required', HTTP_STATUS.BAD_REQUEST);
    }

    const response = await fetch(`${CHATBOT_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new Error(errorData.detail || 'Chatbot service error');
    }

    const data = await response.json();
    return successResponse(res, data, 'Chat response generated');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/chatbot/clear
 * Clear chat history (client-side managed)
 */
router.post('/clear', async (_req: Request, res: Response) => {
  try {
    return successResponse(res, { cleared: true }, 'Chat history cleared');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default router;
