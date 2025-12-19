import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

/**
 * @openapi
 * /payments/create-order:
 *   post:
 *     summary: Create a Razorpay payment order
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500.00
 *               orderId:
 *                 type: string
 *                 example: "sale-12345"
 *               description:
 *                 type: string
 *                 example: "Medicine Purchase"
 *     responses:
 *       200:
 *         description: Payment order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orderId:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 */
router.post('/create-order', authenticate, async (req: Request, res: Response) => {
  try {
    const { amount, orderId, description } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        error: 'Amount and orderId are required',
      });
    }

    const result = await PaymentService.createOrder(amount, orderId, description);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * @openapi
 * /payments/verify:
 *   post:
 *     summary: Verify and capture Razorpay payment
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               razorpayOrderId:
 *                 type: string
 *                 example: "order_1234567890"
 *               razorpayPaymentId:
 *                 type: string
 *                 example: "pay_1234567890"
 *               razorpaySignature:
 *                 type: string
 *                 example: "signature_hash"
 *     responses:
 *       200:
 *         description: Payment verified and captured successfully
 */
router.post('/verify', authenticate, async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: 'All payment details are required',
      });
    }

    // Verify signature
    const isSignatureValid = PaymentService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      });
    }

    // Payment is valid, no need to capture again (Razorpay auto-captures)
    const paymentDetails = await PaymentService.getPaymentDetails(razorpayPaymentId);

    if (!paymentDetails.success) {
      return res.status(400).json(paymentDetails);
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      payment: paymentDetails,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification failed';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * @openapi
 * /payments/{paymentId}:
 *   get:
 *     summary: Get payment details
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 */
router.get('/:paymentId', authenticate, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const paymentDetails = await PaymentService.getPaymentDetails(paymentId);

    if (!paymentDetails.success) {
      return res.status(400).json(paymentDetails);
    }

    return res.json({
      success: true,
      payment: paymentDetails,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payment details';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * @openapi
 * /payments/{paymentId}/refund:
 *   post:
 *     summary: Refund a payment
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500.00
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 */
router.post('/:paymentId/refund', authenticate, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { amount } = req.body;

    const refund = await PaymentService.refundPayment(paymentId, amount);

    if (!refund.success) {
      return res.status(400).json(refund);
    }

    return res.json({
      success: true,
      message: 'Payment refunded successfully',
      refund,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refund failed';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

export default router;
