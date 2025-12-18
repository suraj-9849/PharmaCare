import nodemailer, { Transporter } from 'nodemailer';
import logger from '../config/logger';

interface SupplierOrderEmailData {
  supplierName: string;
  supplierEmail: string;
  drugName: string;
  genericName?: string;
  quantity: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  currentStock: number;
  reorderLevel: number;
  estimatedCost?: number;
  notes?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
}

class SupplierEmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Only initialize if SMTP credentials are provided
      if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        logger.warn('SMTP credentials not configured. Email service will run in simulation mode.');
        return;
      }

      // Configure nodemailer transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      logger.info('Supplier email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize supplier email service:', error);
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('Running in development mode - emails will be simulated');
      }
    }
  }

  /**
   * Generate professional supplier order email HTML
   */
  private generateSupplierOrderEmail(data: SupplierOrderEmailData): string {
    const urgencyColor =
      data.urgency === 'HIGH' ? '#dc2626' : data.urgency === 'MEDIUM' ? '#f59e0b' : '#10b981';

    const deficit = data.reorderLevel - data.currentStock;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Order - PharmaCare</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">PharmaCare</h1>
    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">Professional Pharmacy Management</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Purchase Order Request</h2>
    
    <p style="font-size: 16px; color: #4b5563;">Dear ${data.supplierName},</p>
    
    <p style="color: #6b7280;">
      We would like to place an order for the following pharmaceutical product. Please review the details below and confirm availability and pricing.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span style="background: ${urgencyColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
          ${data.urgency} PRIORITY
        </span>
      </div>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Product Name:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${data.drugName}</td>
        </tr>
        ${
          data.genericName
            ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Generic Name:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${data.genericName}</td>
        </tr>
        `
            : ''
        }
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Quantity Required:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 18px; font-weight: bold;">${data.quantity} units</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Current Stock:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #dc2626;">${data.currentStock} units (${deficit} below reorder level)</td>
        </tr>
        ${
          data.estimatedCost
            ? `
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #374151;">Estimated Budget:</td>
          <td style="padding: 10px 0; color: #059669; font-weight: bold;">₹${data.estimatedCost.toLocaleString('en-IN')}</td>
        </tr>
        `
            : ''
        }
      </table>
    </div>
    
    ${
      data.notes
        ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e;"><strong>Additional Notes:</strong></p>
      <p style="margin: 10px 0 0 0; color: #78350f;">${data.notes}</p>
    </div>
    `
        : ''
    }
    
    <div style="margin: 30px 0;">
      <h3 style="color: #1f2937; margin-bottom: 15px;">Requested Information:</h3>
      <ul style="color: #6b7280; padding-left: 20px;">
        <li>Current availability and stock status</li>
        <li>Unit price and total cost</li>
        <li>Estimated delivery timeline</li>
        <li>Batch/Lot number and expiry date</li>
        <li>Any minimum order requirements</li>
      </ul>
    </div>
    
    <p style="color: #6b7280;">
      Please confirm this order at your earliest convenience. For urgent queries, feel free to contact us directly.
    </p>
    
    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="color: #1e40af; margin-top: 0; font-size: 16px;">Contact Information</h3>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 5px 0; color: #3b82f6; font-weight: bold;">Contact Person:</td>
          <td style="padding: 5px 0; color: #1e40af;">${data.contactPerson}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #3b82f6; font-weight: bold;">Email:</td>
          <td style="padding: 5px 0;"><a href="mailto:${data.contactEmail}" style="color: #2563eb; text-decoration: none;">${data.contactEmail}</a></td>
        </tr>
        ${
          data.contactPhone
            ? `
        <tr>
          <td style="padding: 5px 0; color: #3b82f6; font-weight: bold;">Phone:</td>
          <td style="padding: 5px 0; color: #1e40af;">${data.contactPhone}</td>
        </tr>
        `
            : ''
        }
      </table>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Thank you for your continued partnership and prompt service.
    </p>
    
    <p style="color: #6b7280; font-size: 14px;">
      Best regards,<br>
      <strong style="color: #374151;">PharmaCare Team</strong>
    </p>
  </div>
  
  <div style="background: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
      This is an automated email from PharmaCare Inventory Management System
    </p>
    <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 12px;">
      Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
    </p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Send supplier order email
   */
  async sendSupplierOrderEmail(data: SupplierOrderEmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.transporter) {
      logger.warn('Email transporter not configured. Simulating email send.');
      // In development, simulate successful send
      return {
        success: true,
        messageId: `simulated-${Date.now()}`,
      };
    }

    try {
      const html = this.generateSupplierOrderEmail(data);
      const urgencyPrefix =
        data.urgency === 'HIGH' ? '[URGENT] ' : data.urgency === 'MEDIUM' ? '[Priority] ' : '';

      const mailOptions = {
        from: `"PharmaCare System" <${process.env.SMTP_USER}>`,
        to: data.supplierEmail,
        subject: `${urgencyPrefix}Purchase Order - ${data.drugName} (${data.quantity} units)`,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Supplier order email sent successfully: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error('Failed to send supplier order email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Email transporter not configured. Test email not sent.');
      return false;
    }

    try {
      const mailOptions = {
        from: `"PharmaCare System" <${process.env.SMTP_USER}>`,
        to,
        subject: 'PharmaCare Email Service Test',
        html: `
          <h2>Email Service Test</h2>
          <p>This is a test email from PharmaCare system.</p>
          <p>If you received this, the email service is working correctly.</p>
          <p><em>Sent at: ${new Date().toISOString()}</em></p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Test email sent successfully');
      return true;
    } catch (error) {
      logger.error('Failed to send test email:', error);
      return false;
    }
  }
}

export const supplierEmailService = new SupplierEmailService();
