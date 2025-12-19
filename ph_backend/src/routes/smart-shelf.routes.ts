import { Router, type Router as ExpressRouter } from 'express';
import { smartShelfService } from '../services/smart-shelf.service';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router: ExpressRouter = Router();

// Apply authentication to all routes
router.use(authenticate);

// ==================== NON-PARAMETERIZED ROUTES (MUST BE FIRST) ====================

/**
 * GET /api/smart-shelf
 * Get all shelf locations
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const zone = req.query.zone as string;
    const search = req.query.search as string;

    const result = await smartShelfService.getAllShelves(page, limit, status, zone, search);

    res.json({
      success: true,
      message: 'Shelves retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching shelves:', error);
    res.status(500).json({
      success: false,
      message: message || 'Failed to fetch shelves',
    });
  }
});

/**
 * POST /api/smart-shelf
 * Create new shelf location
 */
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const shelf = await smartShelfService.createShelf(req.body);

    return res.status(201).json({
      success: true,
      message: 'Shelf created successfully',
      data: shelf,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error creating shelf:', error);
    return res.status(400).json({
      success: false,
      message: message || 'Failed to create shelf',
    });
  }
});

/**
 * GET /api/smart-shelf/analytics
 * Get shelf analytics dashboard
 */
router.get('/analytics', async (req: AuthenticatedRequest, res) => {
  try {
    const analytics = await smartShelfService.getShelfAnalytics();

    res.json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: analytics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: message || 'Failed to fetch analytics',
    });
  }
});

/**
 * GET /api/smart-shelf/expiring
 * Get expiring batches for Tinder-style swipe
 */
router.get('/expiring', async (req: AuthenticatedRequest, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await smartShelfService.getExpiringBatches(days, page, limit);

    res.json({
      success: true,
      message: 'Expiring batches retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching expiring batches:', error);
    res.status(500).json({
      success: false,
      message: message || 'Failed to fetch expiring batches',
    });
  }
});

/**
 * GET /api/smart-shelf/expiry-actions
 * Get expiry action history
 */
router.get('/expiry-actions', async (req: AuthenticatedRequest, res) => {
  try {
    const batchId = req.query.batchId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await smartShelfService.getExpiryActionHistory(batchId, page, limit);

    res.json({
      success: true,
      message: 'Expiry action history retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching expiry actions:', error);
    res.status(500).json({
      success: false,
      message: message || 'Failed to fetch expiry actions',
    });
  }
});

/**
 * POST /api/smart-shelf/expiry-action
 * Record expiry action (swipe decision)
 */
router.post('/expiry-action', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const actionRecord = await smartShelfService.recordExpiryAction(req.body, userId);

    res.status(201).json({
      success: true,
      message: 'Expiry action recorded successfully',
      data: actionRecord,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error recording expiry action:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to record expiry action',
    });
  }
});

/**
 * GET /api/smart-shelf/alerts/unacknowledged
 * Get all unacknowledged pick alerts
 */
router.get('/alerts/unacknowledged', async (req: AuthenticatedRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const alerts = await smartShelfService.getUnacknowledgedAlerts(limit);

    res.json({
      success: true,
      message: 'Alerts retrieved successfully',
      data: alerts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: message || 'Failed to fetch alerts',
    });
  }
});

/**
 * PATCH /api/smart-shelf/alerts/:alertId/acknowledge
 * Acknowledge a pick alert
 */
router.patch('/alerts/:alertId/acknowledge', async (req: AuthenticatedRequest, res) => {
  try {
    const { alertId } = req.params;
    const alert = await smartShelfService.acknowledgeAlert(alertId);

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: alert,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error acknowledging alert:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to acknowledge alert',
    });
  }
});

// ==================== PARAMETERIZED ROUTES (AFTER NON-PARAMETERIZED) ====================

/**
 * GET /api/smart-shelf/:id
 * Get shelf by ID with batches
 */
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const shelf = await smartShelfService.getShelfById(id);

    if (!shelf) {
      return res.status(404).json({
        success: false,
        message: 'Shelf not found',
      });
    }

    return res.json({
      success: true,
      message: 'Shelf retrieved successfully',
      data: shelf,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching shelf:', error);
    return res.status(500).json({
      success: false,
      message: message || 'Failed to fetch shelf',
    });
  }
});

/**
 * PUT /api/smart-shelf/:id
 * Update shelf location
 */
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const shelf = await smartShelfService.updateShelf(id, req.body);

    res.json({
      success: true,
      message: 'Shelf updated successfully',
      data: shelf,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error updating shelf:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to update shelf',
    });
  }
});

/**
 * DELETE /api/smart-shelf/:id
 * Delete shelf location
 * Query params: force=true to delete shelf and all its batches
 */
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true';
    await smartShelfService.deleteShelf(id, force);

    res.json({
      success: true,
      message: force ? 'Shelf and all batches deleted successfully' : 'Shelf deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error deleting shelf:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to delete shelf',
    });
  }
});

/**
 * GET /api/smart-shelf/:id/queue
 * Get virtual queue for a shelf
 */
router.get('/:id/queue', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const queue = await smartShelfService.getShelfQueue(id);

    res.json({
      success: true,
      message: 'Queue retrieved successfully',
      data: queue,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching queue:', error);
    res.status(500).json({
      success: false,
      message: message || 'Failed to fetch queue',
    });
  }
});

/**
 * POST /api/smart-shelf/:shelfId/batch/:batchId
 * Add batch to shelf (back of queue)
 */
router.post('/:shelfId/batch/:batchId', async (req: AuthenticatedRequest, res) => {
  try {
    const { shelfId, batchId } = req.params;
    const batch = await smartShelfService.addBatchToShelf(batchId, shelfId);

    res.json({
      success: true,
      message: 'Batch added to shelf successfully',
      data: batch,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error adding batch to shelf:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to add batch to shelf',
    });
  }
});

/**
 * DELETE /api/smart-shelf/:id/batch/front
 * Remove batch from front of queue
 */
router.delete('/:id/batch/front', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const batch = await smartShelfService.removeBatchFromFront(id);

    res.json({
      success: true,
      message: 'Batch removed from front successfully',
      data: batch,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error removing batch:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to remove batch',
    });
  }
});

/**
 * POST /api/smart-shelf/:shelfId/validate-pick
 * Validate if picked batch is correct (FEFO)
 */
router.post('/:shelfId/validate-pick', async (req: AuthenticatedRequest, res) => {
  try {
    const { shelfId } = req.params;
    const { batchId } = req.body;
    const userId = req.user?.id;

    const result = await smartShelfService.validateBatchPick(shelfId, batchId, userId);

    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: result.message,
        data: result,
      });
    }

    return res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error validating pick:', error);
    return res.status(500).json({
      success: false,
      message: message || 'Failed to validate pick',
    });
  }
});

export default router;
