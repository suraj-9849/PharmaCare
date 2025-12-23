import { Router, Request, Response } from 'express';
import { wasteService } from '../services/waste.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/waste-analytics/ai-summary
 * Get AI-powered waste analysis and recommendations
 */
router.post('/ai-summary', async (req: Request, res: Response) => {
  try {
    const { stats, recentRecords } = req.body;

    if (!stats || !recentRecords) {
      return errorResponse(res, 'Stats and recent records are required', HTTP_STATUS.BAD_REQUEST);
    }

    const summary = await wasteService.generateAISummary(stats, recentRecords);
    return successResponse(res, { summary }, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default router;
