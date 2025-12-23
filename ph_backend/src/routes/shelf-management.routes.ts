import { Router, type Router as ExpressRouter } from 'express';
import { shelfManagementService } from '../services/shelf-management.service';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router: ExpressRouter = Router();

// Apply authentication to all routes
router.use(authenticate);

// ==================== CUPBOARD ROUTES ====================

/**
 * GET /api/shelf-management/cupboards
 * Get all cupboards with shelves and items
 */
router.get('/cupboards', async (req: AuthenticatedRequest, res) => {
  try {
    const cupboards = await shelfManagementService.getAllCupboards();

    res.json({
      success: true,
      message: 'Cupboards retrieved successfully',
      data: cupboards,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching cupboards:', error);
    res.status(500).json({
      success: false,
      message: message || 'Failed to fetch cupboards',
    });
  }
});

/**
 * GET /api/shelf-management/cupboards/:id
 * Get cupboard by ID
 */
router.get('/cupboards/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const cupboard = await shelfManagementService.getCupboardById(id);

    if (!cupboard) {
      return res.status(404).json({
        success: false,
        message: 'Cupboard not found',
      });
    }

    return res.json({
      success: true,
      message: 'Cupboard retrieved successfully',
      data: cupboard,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching cupboard:', error);
    return res.status(500).json({
      success: false,
      message: message || 'Failed to fetch cupboard',
    });
  }
});

/**
 * POST /api/shelf-management/cupboards
 * Create new cupboard
 */
router.post('/cupboards', async (req: AuthenticatedRequest, res) => {
  try {
    const cupboard = await shelfManagementService.createCupboard(req.body);

    res.status(201).json({
      success: true,
      message: 'Cupboard created successfully',
      data: cupboard,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error creating cupboard:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to create cupboard',
    });
  }
});

/**
 * PUT /api/shelf-management/cupboards/:id
 * Update cupboard
 */
router.put('/cupboards/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const cupboard = await shelfManagementService.updateCupboard(id, req.body);

    res.json({
      success: true,
      message: 'Cupboard updated successfully',
      data: cupboard,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error updating cupboard:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to update cupboard',
    });
  }
});

/**
 * DELETE /api/shelf-management/cupboards/:id
 * Delete cupboard
 */
router.delete('/cupboards/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await shelfManagementService.deleteCupboard(id);

    res.json({
      success: true,
      message: 'Cupboard deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error deleting cupboard:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to delete cupboard',
    });
  }
});

// ==================== SHELF ROUTES ====================

/**
 * GET /api/shelf-management/shelves/:id
 * Get shelf by ID
 */
router.get('/shelves/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const shelf = await shelfManagementService.getShelfById(id);

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
 * POST /api/shelf-management/shelves
 * Create new shelf in cupboard
 */
router.post('/shelves', async (req: AuthenticatedRequest, res) => {
  try {
    const shelf = await shelfManagementService.createShelf(req.body);

    res.status(201).json({
      success: true,
      message: 'Shelf created successfully',
      data: shelf,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error creating shelf:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to create shelf',
    });
  }
});

/**
 * PUT /api/shelf-management/shelves/:id
 * Update shelf
 */
router.put('/shelves/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const shelf = await shelfManagementService.updateShelf(id, req.body);

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
 * DELETE /api/shelf-management/shelves/:id
 * Delete shelf
 */
router.delete('/shelves/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await shelfManagementService.deleteShelf(id);

    res.json({
      success: true,
      message: 'Shelf deleted successfully',
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

// ==================== SHELF ITEM ROUTES ====================

/**
 * POST /api/shelf-management/assign
 * Assign items from batch to shelf
 * Body: { shelfId, batchId, quantity }
 */
router.post('/assign', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await shelfManagementService.assignItemsToShelf(req.body);

    res.status(201).json({
      success: true,
      message: 'Items assigned to shelf successfully',
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error assigning items:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to assign items',
    });
  }
});

/**
 * POST /api/shelf-management/remove
 * Remove items from shelf (return to unassigned)
 * Body: { shelfItemId, quantity }
 */
router.post('/remove', async (req: AuthenticatedRequest, res) => {
  try {
    const { shelfItemId, quantity } = req.body;
    const result = await shelfManagementService.removeItemsFromShelf(shelfItemId, quantity);

    res.json({
      success: true,
      message: 'Items removed from shelf successfully',
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error removing items:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to remove items',
    });
  }
});

/**
 * POST /api/shelf-management/move
 * Move items from one shelf to another
 * Body: { fromShelfId, toShelfId, batchId, quantity }
 */
router.post('/move', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await shelfManagementService.moveItemsBetweenShelves(req.body);

    res.json({
      success: true,
      message: 'Items moved successfully',
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error moving items:', error);
    res.status(400).json({
      success: false,
      message: message || 'Failed to move items',
    });
  }
});

/**
 * GET /api/shelf-management/unassigned
 * Get all unassigned inventory (available to assign to shelves)
 */
router.get('/unassigned', async (req: AuthenticatedRequest, res) => {
  try {
    const inventory = await shelfManagementService.getUnassignedInventory();

    res.json({
      success: true,
      message: 'Unassigned inventory retrieved successfully',
      data: inventory,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching unassigned inventory:', error);
    res.status(500).json({
      success: false,
      message: message || 'Failed to fetch unassigned inventory',
    });
  }
});

/**
 * GET /api/shelf-management/find-drug/:drugId
 * Find which shelves contain a specific drug
 */
router.get('/find-drug/:drugId', async (req: AuthenticatedRequest, res) => {
  try {
    const { drugId } = req.params;
    const locations = await shelfManagementService.findDrugOnShelves(drugId);

    res.json({
      success: true,
      message: 'Drug locations retrieved successfully',
      data: locations,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error finding drug:', error);
    res.status(500).json({
      success: false,
      message: message || 'Failed to find drug locations',
    });
  }
});

export default router;
