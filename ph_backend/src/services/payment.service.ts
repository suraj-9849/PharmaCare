import Razorpay from 'razorpay';
import crypto from 'crypto';

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status?: string;
  created_at?: number;
}

interface RazorpayPayment {
  id: string;
  status: string;
  amount: number;
  method?: string;
  email?: string;
  contact?: string;
  vpa?: string;
  created_at?: number;
}

interface RazorpayRefund {
  id: string;
  status: string;
  amount: number;
  payment_id?: string;
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export class PaymentService {
  /**
   * Create a Razorpay order for UPI payment
   */
  static async createOrder(
    amount: number,
    orderId: string,
    _description: string = 'Medicine Purchase'
  ) {
    try {
      const orderData = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: orderId,
        notes: {
          orderId,
        },
      };

      const order = (await razorpay.orders.create(orderData)) as RazorpayOrder;

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create payment order';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  static verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    try {
      const message = `${razorpayOrderId}|${razorpayPaymentId}`;
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(message)
        .digest('hex');

      return signature === razorpaySignature;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  /**
   * Capture payment after verification
   */
  static async capturePayment(razorpayPaymentId: string, amount: number) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payment = await (razorpay.payments as any).capture(
        razorpayPaymentId,
        Math.round(amount * 100)
      );

      return {
        success: true,
        paymentId: (payment as RazorpayPayment).id,
        status: (payment as RazorpayPayment).status,
        amount: (payment as RazorpayPayment).amount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to capture payment';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(razorpayPaymentId: string, amount?: number) {
    try {
      const options: Record<string, number | undefined> = {};
      if (amount) {
        options.amount = Math.round(amount * 100); // Convert to paise
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const refund = await (razorpay.payments as any).refund(
        razorpayPaymentId,
        options.amount ? { amount: options.amount } : {}
      );

      return {
        success: true,
        refundId: (refund as RazorpayRefund).id,
        status: (refund as RazorpayRefund).status,
        amount: (refund as RazorpayRefund).amount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refund payment';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Get payment details
   */
  static async getPaymentDetails(razorpayPaymentId: string) {
    try {
      const payment = (await razorpay.payments.fetch(razorpayPaymentId)) as RazorpayPayment;

      const amountInRupees =
        typeof payment.amount === 'number'
          ? payment.amount / 100
          : parseFloat(String(payment.amount)) / 100;

      return {
        success: true,
        paymentId: payment.id,
        status: payment.status,
        amount: amountInRupees,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        vpa: payment.vpa,
        created_at: new Date((payment.created_at || 0) * 1000),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch payment details';
      return {
        success: false,
        error: message,
      };
    }
  }
}
