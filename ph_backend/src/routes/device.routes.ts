import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';
import { subscribeToTopic } from '../services/firebase.service';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/devices/register
 * Register a device for push notifications
 */
router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { fcmToken, deviceId, platform } = req.body;

    if (!fcmToken) {
      return errorResponse(res, 'FCM token is required', HTTP_STATUS.BAD_REQUEST);
    }

    // Upsert device
    const device = await prisma.userDevice.upsert({
      where: { fcmToken },
      update: {
        userId: req.user.id,
        deviceId,
        platform,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId: req.user.id,
        fcmToken,
        deviceId,
        platform,
        isActive: true,
      },
    });

    // Subscribe to relevant topics
    await subscribeToTopic(fcmToken, 'all-users');
    await subscribeToTopic(fcmToken, 'sales-alerts');
    await subscribeToTopic(fcmToken, 'inventory-alerts');

    console.log(`✅ Device registered for user ${req.user.username}: ${deviceId || 'unknown'}`);

    return successResponse(res, device, 'Device registered successfully');
  } catch (error) {
    console.error('❌ Error registering device:', error);
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/devices/unregister
 * Unregister a device (e.g., on logout)
 */
router.post('/unregister', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { fcmToken } = req.body;

    if (!fcmToken) {
      return errorResponse(res, 'FCM token is required', HTTP_STATUS.BAD_REQUEST);
    }

    // Deactivate device
    await prisma.userDevice.updateMany({
      where: {
        fcmToken,
        userId: req.user.id,
      },
      data: {
        isActive: false,
      },
    });

    console.log(`✅ Device unregistered for user ${req.user.username}`);

    return successResponse(res, null, 'Device unregistered successfully');
  } catch (error) {
    console.error('❌ Error unregistering device:', error);
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/devices
 * Get all registered devices for the current user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const devices = await prisma.userDevice.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
      },
      select: {
        id: true,
        deviceId: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(res, devices, SUCCESS_MESSAGES.FETCH_SUCCESS);
  } catch (error) {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default router;
