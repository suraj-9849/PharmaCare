import { Router, Response } from 'express';
import { prescriptionHistoryService } from '../services/prescription-history.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/prescription-histories
 * Get all prescription histories with pagination
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    let result;

    if (search) {
      result = await prescriptionHistoryService.searchPrescriptionHistories(
        search as string,
        Number(page),
        Number(limit)
      );
    } else {
      result = await prescriptionHistoryService.getAllPrescriptionHistories(
        Number(page),
        Number(limit)
      );
    }

    return paginatedResponse(
      res,
      result.histories,
      result.pagination,
      SUCCESS_MESSAGES.FETCH_SUCCESS
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/prescription-histories/patient/:patientName
 * Get prescription histories by patient name
 */
router.get('/patient/:patientName', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await prescriptionHistoryService.getPrescriptionHistoriesByPatient(
      req.params.patientName,
      Number(page),
      Number(limit)
    );
    return paginatedResponse(
      res,
      result.histories,
      result.pagination,
      SUCCESS_MESSAGES.FETCH_SUCCESS
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/prescription-histories/stats
 * Get prescription statistics
 */
router.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await prescriptionHistoryService.getPrescriptionStatistics();
    return successResponse(res, stats, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/prescription-histories/:id
 * Get prescription history by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await prescriptionHistoryService.getPrescriptionHistoryById(req.params.id);
    if (!history) {
      return errorResponse(res, 'Prescription history not found', HTTP_STATUS.NOT_FOUND);
    }
    return successResponse(res, history, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/prescription-histories
 * Create new prescription history
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await prescriptionHistoryService.createPrescriptionHistory(req.body);
    return successResponse(
      res,
      history,
      'Prescription history created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * PATCH /api/prescription-histories/:id
 * Update prescription history
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await prescriptionHistoryService.updatePrescriptionHistory(
      req.params.id,
      req.body
    );
    return successResponse(res, history, 'Prescription history updated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * DELETE /api/prescription-histories/:id
 * Delete prescription history
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await prescriptionHistoryService.deletePrescriptionHistory(req.params.id);
    return successResponse(res, result, 'Prescription history deleted successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

export default router;
