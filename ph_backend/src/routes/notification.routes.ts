import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';

const router: RouterType = Router();

/**
 * @route   POST /api/notifications/register-device
 * @desc    Register a device for push notifications
 * @access  Private (requires authentication)
 */
router.post('/register-device', authenticate, async (req: Request, res: Response) => {
  try {
    const { fcmToken, deviceId, platform } = req.body;
    const userId = req.user!.id;

    if (!fcmToken) {
      return errorResponse(res, 'FCM token is required', 400);
    }

    console.log(`📱 Registering device for user ${userId}`);

    // Check if this token already exists
    const existingDevice = await prisma.userDevice.findUnique({
      where: { fcmToken },
    });

    let device;

    if (existingDevice) {
      // Update existing device
      device = await prisma.userDevice.update({
        where: { fcmToken },
        data: {
          userId,
          deviceId,
          platform,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Updated existing device registration`);
    } else {
      // Create new device registration
      device = await prisma.userDevice.create({
        data: {
          userId,
          fcmToken,
          deviceId,
          platform,
          isActive: true,
        },
      });
      console.log(`✅ Created new device registration`);
    }

    return successResponse(res, device, 'Device registered for notifications successfully', 200);
  } catch (error) {
    console.error('Error registering device:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to register device';
    return errorResponse(res, errorMessage, 500);
  }
});

/**
 * @route   POST /api/notifications/unregister-device
 * @desc    Unregister a device from push notifications
 * @access  Private (requires authentication)
 */
router.post('/unregister-device', authenticate, async (req: Request, res: Response) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return errorResponse(res, 'FCM token is required', 400);
    }

    console.log(`📱 Unregistering device`);

    await prisma.userDevice.updateMany({
      where: { fcmToken },
      data: { isActive: false },
    });

    console.log(`✅ Device unregistered successfully`);

    return successResponse(res, null, 'Device unregistered successfully', 200);
  } catch (error) {
    console.error('Error unregistering device:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to unregister device';
    return errorResponse(res, errorMessage, 500);
  }
});

/**
 * @route   GET /api/notifications/alerts
 * @desc    Get all stock alerts for the user
 * @access  Private (requires authentication)
 */
router.get('/alerts', authenticate, async (req: Request, res: Response) => {
  try {
    const { unreadOnly } = req.query;

    const whereClause = unreadOnly === 'true' ? { isRead: false } : {};

    const alerts = await prisma.stockAlert.findMany({
      where: whereClause,
      include: {
        drug: {
          select: {
            id: true,
            brandName: true,
            genericName: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 alerts
    });

    return successResponse(res, alerts, 'Alerts retrieved successfully', 200);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch alerts';
    return errorResponse(res, errorMessage, 500);
  }
});

/**
 * @route   POST /api/notifications/alerts/:id/mark-read
 * @desc    Mark an alert as read
 * @access  Private (requires authentication)
 */
router.post('/alerts/:id/mark-read', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const alert = await prisma.stockAlert.update({
      where: { id },
      data: { isRead: true },
    });

    return successResponse(res, alert, 'Alert marked as read', 200);
  } catch (error) {
    console.error('Error marking alert as read:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to mark alert as read';
    return errorResponse(res, errorMessage, 500);
  }
});

/**
 * @route   POST /api/notifications/alerts/mark-all-read
 * @desc    Mark all alerts as read
 * @access  Private (requires authentication)
 */
router.post('/alerts/mark-all-read', authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.stockAlert.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    return successResponse(res, null, 'All alerts marked as read', 200);
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to mark all alerts as read';
    return errorResponse(res, errorMessage, 500);
  }
});

export default router;
