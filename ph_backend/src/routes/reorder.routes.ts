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

/**
 * GET /api/reorders/:id/previous-suppliers
 * Get previous suppliers for a drug in reorder request
 */
router.get('/:id/previous-suppliers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reorder = await reorderService.getReorderById(req.params.id);
    const suppliers = await reorderService.getPreviousSuppliers(reorder.drugId);
    return successResponse(res, suppliers, 'Previous suppliers fetched successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/reorders/:id/search-suppliers
 * Search for public suppliers for a drug in reorder request
 */
router.get('/:id/search-suppliers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reorder = await reorderService.getReorderById(req.params.id);
    const searchResults = await reorderService.searchPublicSuppliers(reorder.drugId);
    return successResponse(res, searchResults, 'Supplier search completed successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/reorders/:id/send-email
 * Send email to supplier for reorder
 */
router.post('/:id/send-email', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { quantity, contactPerson, contactEmail, contactPhone } = req.body;

    if (!quantity || !contactPerson || !contactEmail) {
      return errorResponse(
        res,
        'Quantity, contact person, and contact email are required',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const emailResult = await reorderService.sendSupplierEmail({
      reorderId: req.params.id,
      userId: req.user.id,
      quantity,
      contactPerson,
      contactEmail,
      contactPhone,
    });

    if (emailResult.success) {
      return successResponse(res, emailResult, 'Email sent to supplier successfully');
    } else {
      return errorResponse(
        res,
        emailResult.error || 'Failed to send email',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/reorders/from-public-supplier
 * Create reorder request from public supplier
 */
router.post('/from-public-supplier', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { drugId, requestedQty, supplierName, supplierEmail, supplierUrl, estimatedCost, notes } =
      req.body;

    if (!drugId || !requestedQty || !supplierName || !supplierEmail || !supplierUrl) {
      return errorResponse(
        res,
        'Drug ID, quantity, supplier name, email, and URL are required',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const reorder = await reorderService.createReorderFromPublicSupplier(req.user.id, {
      drugId,
      requestedQty: Number(requestedQty),
      supplierName,
      supplierEmail,
      supplierUrl,
      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      notes,
    });

    return successResponse(
      res,
      reorder,
      'Reorder request from public supplier created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * POST /api/reorders/:id/complete
 * Mark reorder as completed
 */
router.post('/:id/complete', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { actualCost } = req.body;
    const reorder = await reorderService.completeReorder(
      req.params.id,
      actualCost ? Number(actualCost) : undefined
    );

    return successResponse(res, reorder, 'Reorder marked as completed successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default router;
