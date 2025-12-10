import { Router, Response } from 'express';
import { reorderService } from '../services/reorder.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/reorders
 * Get all reorder requests with pagination and filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, status, priority } = req.query;
    const result = await reorderService.getAllReorders(
      Number(page),
      Number(limit),
      status as string,
      priority as string
    );
    return paginatedResponse(
      res,
      result.reorders,
      result.pagination,
      SUCCESS_MESSAGES.FETCH_SUCCESS
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/reorders/stats
 * Get reorder statistics
 */
router.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await reorderService.getReorderStats();
    return successResponse(res, stats, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/reorders/drugs-needing-reorder
 * Get drugs that need reordering
 */
router.get('/drugs-needing-reorder', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const drugs = await reorderService.getDrugsNeedingReorder();
    return successResponse(res, drugs, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/reorders/:id
 * Get reorder by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reorder = await reorderService.getReorderById(req.params.id);
    return successResponse(res, reorder, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    const statusCode =
      message === 'Reorder request not found'
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return errorResponse(res, message, statusCode);
  }
});

/**
 * POST /api/reorders
 * Create new reorder request
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const reorder = await reorderService.createReorder(req.user.id, req.body);
    return successResponse(
      res,
      reorder,
      'Reorder request created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * PATCH /api/reorders/:id
 * Update reorder request
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const reorder = await reorderService.updateReorder(req.params.id, req.user.id, req.body);
    return successResponse(res, reorder, 'Reorder request updated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * DELETE /api/reorders/:id
 * Delete reorder request
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await reorderService.deleteReorder(req.params.id);
    return successResponse(res, result, 'Reorder request deleted successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * POST /api/reorders/:id/approve
 * Approve reorder request
 */
router.post('/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const reorder = await reorderService.updateReorder(req.params.id, req.user.id, {
      status: 'APPROVED',
    });
    return successResponse(res, reorder, 'Reorder request approved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * POST /api/reorders/:id/reject
 * Reject reorder request
 */
router.post('/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const reorder = await reorderService.updateReorder(req.params.id, req.user.id, {
      status: 'REJECTED',
      notes: req.body.notes || 'Rejected by admin',
    });
    return successResponse(res, reorder, 'Reorder request rejected successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * POST /api/reorders/:id/ordered
 * Mark reorder as ordered
 */
router.post('/:id/ordered', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const reorder = await reorderService.updateReorder(req.params.id, req.user.id, {
      status: 'ORDERED',
    });
    return successResponse(res, reorder, 'Reorder marked as ordered successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * POST /api/reorders/:id/receive
 * Mark reorder as received
 */
router.post('/:id/receive', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const reorder = await reorderService.updateReorder(req.params.id, req.user.id, {
      status: 'RECEIVED',
    });
    return successResponse(res, reorder, 'Reorder marked as received successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

export default router;
