import { Resend } from 'resend';
import env from '../config/env';

const resend = new Resend(process.env.RESEND_API_KEY);

interface LowStockEmailData {
  drugName: string;
  brandName: string;
  currentStock: number;
  reorderLevel: number;
  stockPercentage: number;
  category: string;
  sku: string;
}

export class EmailService {
  /**
   * Send low stock alert email
   */
  static async sendLowStockAlert(drugs: LowStockEmailData[]) {
    if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) {
      console.warn('Email not configured. Skipping email notification.');
      return;
    }

    try {
      const criticalDrugs = drugs.filter((d) => d.stockPercentage <= 25);
      const lowDrugs = drugs.filter((d) => d.stockPercentage > 25 && d.stockPercentage <= 50);

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Stock Alert</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 14px;">${env.APP_NAME} - Inventory Alert System</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
              This is an automated alert regarding low inventory levels in your pharmacy system.
            </p>

            ${
              criticalDrugs.length > 0
                ? `
              <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <h2 style="color: #dc2626; font-size: 18px; margin: 0 0 15px 0;"> Critical Stock (0-25%)</h2>
                <p style="color: #991b1b; font-size: 14px; margin: 0 0 15px 0;">
                  <strong>${criticalDrugs.length}</strong> item(s) require immediate attention!
                </p>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #fee2e2;">
                      <th style="padding: 10px; text-align: left; font-size: 12px; color: #991b1b; border-bottom: 2px solid #fca5a5;">Drug</th>
                      <th style="padding: 10px; text-align: center; font-size: 12px; color: #991b1b; border-bottom: 2px solid #fca5a5;">Stock</th>
                      <th style="padding: 10px; text-align: center; font-size: 12px; color: #991b1b; border-bottom: 2px solid #fca5a5;">Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${criticalDrugs
                      .map(
                        (drug) => `
                      <tr style="border-bottom: 1px solid #fecaca;">
                        <td style="padding: 10px; font-size: 13px; color: #374151;">
                          <strong>${drug.brandName}</strong><br/>
                          <span style="color: #6b7280; font-size: 11px;">${drug.category} | ${drug.sku}</span>
                        </td>
                        <td style="padding: 10px; text-align: center; font-size: 13px; color: #dc2626; font-weight: bold;">
                          ${drug.currentStock}
                        </td>
                        <td style="padding: 10px; text-align: center; font-size: 13px; color: #6b7280;">
                          ${drug.reorderLevel}
                        </td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
                : ''
            }

            ${
              lowDrugs.length > 0
                ? `
              <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <h2 style="color: #ea580c; font-size: 18px; margin: 0 0 15px 0;"> Low Stock (25-50%)</h2>
                <p style="color: #9a3412; font-size: 14px; margin: 0 0 15px 0;">
                  <strong>${lowDrugs.length}</strong> item(s) need restocking soon.
                </p>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #fed7aa;">
                      <th style="padding: 10px; text-align: left; font-size: 12px; color: #9a3412; border-bottom: 2px solid #fdba74;">Drug</th>
                      <th style="padding: 10px; text-align: center; font-size: 12px; color: #9a3412; border-bottom: 2px solid #fdba74;">Stock</th>
                      <th style="padding: 10px; text-align: center; font-size: 12px; color: #9a3412; border-bottom: 2px solid #fdba74;">Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lowDrugs
                      .map(
                        (drug) => `
                      <tr style="border-bottom: 1px solid #fed7aa;">
                        <td style="padding: 10px; font-size: 13px; color: #374151;">
                          <strong>${drug.brandName}</strong><br/>
                          <span style="color: #6b7280; font-size: 11px;">${drug.category} | ${drug.sku}</span>
                        </td>
                        <td style="padding: 10px; text-align: center; font-size: 13px; color: #ea580c; font-weight: bold;">
                          ${drug.currentStock}
                        </td>
                        <td style="padding: 10px; text-align: center; font-size: 13px; color: #6b7280;">
                          ${drug.reorderLevel}
                        </td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
                : ''
            }

            <div style="background: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 20px;">
              <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center;">
                📊 <strong>Recommended Action:</strong> Review your inventory and place orders with suppliers to maintain optimal stock levels.
              </p>
            </div>
          </div>

          <div style="background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated notification from <strong>${env.APP_NAME}</strong><br/>
              Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'PharmaCare <onboarding@resend.dev>',
        to: process.env.ADMIN_EMAIL,
        subject: ` Low Stock Alert - ${criticalDrugs.length} Critical Items`,
        html: emailBody,
      });

      console.log(` Low stock alert email sent to ${process.env.ADMIN_EMAIL}`);
    } catch (error) {
      console.error('Failed to send low stock email:', error);
    }
  }

  /**
   * Send out of stock alert email
   */
  static async sendOutOfStockAlert(drugs: LowStockEmailData[]) {
    if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) {
      console.warn('Email not configured. Skipping email notification.');
      return;
    }

    try {
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;"> OUT OF STOCK ALERT</h1>
            <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 14px;">${env.APP_NAME} - Critical Inventory Alert</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #991b1b; font-size: 18px; font-weight: bold; margin: 0 0 10px 0; text-align: center;">
                 URGENT: ${drugs.length} Item(s) Out of Stock
              </p>
              <p style="color: #991b1b; font-size: 14px; margin: 0; text-align: center;">
                These medications are completely depleted and unavailable for sale.
              </p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background: #fee2e2;">
                  <th style="padding: 12px; text-align: left; font-size: 13px; color: #991b1b; border-bottom: 2px solid #fca5a5;">Drug Details</th>
                  <th style="padding: 12px; text-align: center; font-size: 13px; color: #991b1b; border-bottom: 2px solid #fca5a5;">Required Qty</th>
                </tr>
              </thead>
              <tbody>
                ${drugs
                  .map(
                    (drug) => `
                  <tr style="border-bottom: 1px solid #fecaca;">
                    <td style="padding: 12px; font-size: 14px; color: #374151;">
                      <strong style="color: #dc2626;">${drug.brandName}</strong><br/>
                      <span style="color: #6b7280; font-size: 12px;">${drug.drugName}</span><br/>
                      <span style="color: #9ca3af; font-size: 11px;">${drug.category} | ${drug.sku}</span>
                    </td>
                    <td style="padding: 12px; text-align: center; font-size: 14px; color: #059669; font-weight: bold;">
                      ${drug.reorderLevel} units
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-top: 25px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                <strong>⚡ Immediate Action Required:</strong><br/>
                Contact suppliers immediately to place emergency orders for these items.
              </p>
            </div>
          </div>

          <div style="background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated critical alert from <strong>${env.APP_NAME}</strong><br/>
              Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'PharmaCare <onboarding@resend.dev>',
        to: process.env.ADMIN_EMAIL,
        subject: ` URGENT: ${drugs.length} Items Out of Stock`,
        html: emailBody,
      });

      console.log(` Out of stock alert email sent to ${process.env.ADMIN_EMAIL}`);
    } catch (error) {
      console.error('Failed to send out of stock email:', error);
    }
  }

  /**
   * Send return to vendor notification email
   */
  static async sendReturnToVendorEmail(
    supplierEmail: string,
    supplierName: string,
    returnData: {
      drugs: Array<{
        drugName: string;
        brandName: string;
        batchNumber: string;
        quantity: number;
        returnQuantity: number;
        expiryDate: string;
        reason: string;
      }>;
      collectionDays: number;
      pharmacyName: string;
      pharmacyAddress: string;
      returnId: string;
    }
  ) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('Resend API key not configured. Skipping email notification.');
      return { success: false, error: 'Email not configured' };
    }

    try {
      const totalItems = returnData.drugs.reduce((sum: number, d) => sum + d.returnQuantity, 0);
      const collectionDate = new Date();
      collectionDate.setDate(collectionDate.getDate() + returnData.collectionDays);

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 26px;">📦 Product Return Request</h1>
            <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 14px;">Return ID: ${returnData.returnId}</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
              <p style="color: #1e40af; font-size: 16px; margin: 0;">
                Dear <strong>${supplierName}</strong>,
              </p>
              <p style="color: #1e40af; font-size: 14px; margin: 10px 0 0 0;">
                We are initiating a return request for the following items from our pharmacy inventory.
              </p>
            </div>

            <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              📋 Items for Return
            </h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 12px 10px; text-align: left; font-size: 12px; color: #475569; border-bottom: 2px solid #cbd5e1;">Drug Details</th>
                  <th style="padding: 12px 10px; text-align: center; font-size: 12px; color: #475569; border-bottom: 2px solid #cbd5e1;">Batch No.</th>
                  <th style="padding: 12px 10px; text-align: center; font-size: 12px; color: #475569; border-bottom: 2px solid #cbd5e1;">Return Qty</th>
                  <th style="padding: 12px 10px; text-align: center; font-size: 12px; color: #475569; border-bottom: 2px solid #cbd5e1;">Expiry</th>
                  <th style="padding: 12px 10px; text-align: left; font-size: 12px; color: #475569; border-bottom: 2px solid #cbd5e1;">Reason</th>
                </tr>
              </thead>
              <tbody>
                ${returnData.drugs
                  .map(
                    (drug, index) => `
                  <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 10px; font-size: 13px;">
                      <strong style="color: #1e293b;">${drug.brandName}</strong><br/>
                      <span style="color: #64748b; font-size: 11px;">${drug.drugName}</span>
                    </td>
                    <td style="padding: 12px 10px; text-align: center; font-size: 13px; color: #475569; font-family: monospace;">
                      ${drug.batchNumber}
                    </td>
                    <td style="padding: 12px 10px; text-align: center; font-size: 14px; color: #dc2626; font-weight: bold;">
                      ${drug.returnQuantity}
                    </td>
                    <td style="padding: 12px 10px; text-align: center; font-size: 12px; color: #f59e0b;">
                      ${drug.expiryDate}
                    </td>
                    <td style="padding: 12px 10px; font-size: 12px; color: #64748b;">
                      ${drug.reason}
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <div style="display: flex; gap: 20px; margin-bottom: 25px;">
              <div style="flex: 1; background: #fef3c7; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="color: #92400e; font-size: 12px; margin: 0 0 5px 0;">Total Items</p>
                <p style="color: #78350f; font-size: 24px; font-weight: bold; margin: 0;">${totalItems}</p>
              </div>
              <div style="flex: 1; background: #dcfce7; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="color: #166534; font-size: 12px; margin: 0 0 5px 0;">Collection By</p>
                <p style="color: #14532d; font-size: 16px; font-weight: bold; margin: 0;">${collectionDate.toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
              </div>
            </div>

            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #991b1b; font-size: 14px; margin: 0 0 10px 0;">📍 Collection Address</h3>
              <p style="color: #7f1d1d; font-size: 14px; margin: 0; line-height: 1.6;">
                <strong>${returnData.pharmacyName}</strong><br/>
                ${returnData.pharmacyAddress}
              </p>
            </div>

            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; border-radius: 4px;">
              <p style="color: #166534; font-size: 14px; margin: 0;">
                <strong>⏰ Collection Deadline:</strong> Please arrange for collection within <strong>${returnData.collectionDays} days</strong> (by ${collectionDate.toLocaleDateString('en-US', { dateStyle: 'full' })}).
              </p>
            </div>
          </div>

          <div style="background: #f1f5f9; padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              This is an automated notification from <strong>${env.APP_NAME}</strong><br/>
              For queries, please contact us at ${process.env.ADMIN_EMAIL || 'support@pharmacy.com'}
            </p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'PharmaCare <onboarding@resend.dev>',
        // Note: Resend free tier only allows sending to verified emails
        // In production, use supplierEmail directly with a verified domain
        to: process.env.ADMIN_EMAIL || supplierEmail,
        subject: `📦 Product Return Request - ${totalItems} Items | Return ID: ${returnData.returnId}`,
        html: emailBody,
      });

      console.log(
        `✅ Return to vendor email sent to ${process.env.ADMIN_EMAIL || supplierEmail} (intended for: ${supplierEmail})`
      );
      return { success: true };
    } catch (error) {
      console.error('Failed to send return to vendor email:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send expiry alert email for drugs expiring within 30 days
   */
  static async sendExpiryAlert(
    expiringDrugs: Array<{
      brandName: string;
      genericName: string;
      category: string;
      sku: string;
      batchNumber: string;
      expiryDate: Date;
      currentStock: number;
      daysUntilExpiry: number;
    }>
  ) {
    if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) {
      console.warn('Email not configured. Skipping expiry alert notification.');
      return;
    }

    try {
      // Categorize by urgency
      const critical = expiringDrugs.filter((d) => d.daysUntilExpiry <= 7);
      const urgent = expiringDrugs.filter((d) => d.daysUntilExpiry > 7 && d.daysUntilExpiry <= 15);
      const upcoming = expiringDrugs.filter((d) => d.daysUntilExpiry > 15);

      const totalValue = expiringDrugs.reduce((sum, drug) => sum + drug.currentStock, 0);

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Expiry Alert</h1>
            <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 14px;">${env.APP_NAME} - Daily Expiry Monitoring</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
              Daily expiry check detected <strong>${expiringDrugs.length}</strong> drug(s) expiring within the next 30 days.
            </p>

            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-around;">
                <div style="text-align: center;">
                  <p style="color: #991b1b; font-size: 12px; margin: 0;">Total Items</p>
                  <p style="color: #dc2626; font-size: 20px; font-weight: bold; margin: 5px 0 0 0;">${expiringDrugs.length}</p>
                </div>
                <div style="text-align: center;">
                  <p style="color: #991b1b; font-size: 12px; margin: 0;">Total Stock</p>
                  <p style="color: #dc2626; font-size: 20px; font-weight: bold; margin: 5px 0 0 0;">${totalValue} units</p>
                </div>
              </div>
            </div>

            ${
              critical.length > 0
                ? `
              <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <h2 style="color: #dc2626; font-size: 18px; margin: 0 0 10px 0;">🚨 Critical (≤7 days)</h2>
                <p style="color: #991b1b; font-size: 14px; margin: 0 0 15px 0;">
                  <strong>${critical.length}</strong> item(s) expiring within 1 week - Immediate action required!
                </p>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #fee2e2;">
                      <th style="padding: 8px; text-align: left; font-size: 11px; color: #991b1b;">Drug</th>
                      <th style="padding: 8px; text-align: center; font-size: 11px; color: #991b1b;">Batch</th>
                      <th style="padding: 8px; text-align: center; font-size: 11px; color: #991b1b;">Stock</th>
                      <th style="padding: 8px; text-align: center; font-size: 11px; color: #991b1b;">Expires In</th>
                      <th style="padding: 8px; text-align: center; font-size: 11px; color: #991b1b;">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${critical
                      .map(
                        (drug) => `
                      <tr style="border-bottom: 1px solid #fecaca;">
                        <td style="padding: 8px; font-size: 12px;">
                          <strong>${drug.brandName}</strong><br/>
                          <span style="color: #6b7280; font-size: 10px;">${drug.category} | ${drug.sku}</span>
                        </td>
                        <td style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">
                          ${drug.batchNumber}
                        </td>
                        <td style="padding: 8px; text-align: center; font-size: 12px; font-weight: bold; color: #dc2626;">
                          ${drug.currentStock}
                        </td>
                        <td style="padding: 8px; text-align: center; font-size: 12px; font-weight: bold; color: #dc2626;">
                          ${drug.daysUntilExpiry} day${drug.daysUntilExpiry !== 1 ? 's' : ''}
                        </td>
                        <td style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">
                          ${drug.expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
                : ''
            }

            ${
              urgent.length > 0
                ? `
              <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <h2 style="color: #ea580c; font-size: 18px; margin: 0 0 10px 0;">⚠️ Urgent (8-15 days)</h2>
                <p style="color: #9a3412; font-size: 14px; margin: 0 0 15px 0;">
                  <strong>${urgent.length}</strong> item(s) expiring within 2 weeks.
                </p>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #fed7aa;">
                      <th style="padding: 8px; text-align: left; font-size: 11px; color: #9a3412;">Drug</th>
                      <th style="padding: 8px; text-align: center; font-size: 11px; color: #9a3412;">Batch</th>
                      <th style="padding: 8px; text-align: center; font-size: 11px; color: #9a3412;">Stock</th>
                      <th style="padding: 8px; text-align: center; font-size: 11px; color: #9a3412;">Expires In</th>
                      <th style="padding: 8px; text-align: center; font-size: 11px; color: #9a3412;">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${urgent
                      .map(
                        (drug) => `
                      <tr style="border-bottom: 1px solid #fed7aa;">
                        <td style="padding: 8px; font-size: 12px;">
                          <strong>${drug.brandName}</strong><br/>
                          <span style="color: #6b7280; font-size: 10px;">${drug.category} | ${drug.sku}</span>
                        </td>
                        <td style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">
                          ${drug.batchNumber}
                        </td>
                        <td style="padding: 8px; text-align: center; font-size: 12px; font-weight: bold; color: #ea580c;">
                          ${drug.currentStock}
                        </td>
                        <td style="padding: 8px; text-align: center; font-size: 12px; font-weight: bold; color: #ea580c;">
                          ${drug.daysUntilExpiry} days
                        </td>
                        <td style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">
                          ${drug.expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
                : ''
            }

            ${
              upcoming.length > 0
                ? `
              <div style="background: #fef9c3; border-left: 4px solid #eab308; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <h2 style="color: #ca8a04; font-size: 18px; margin: 0 0 10px 0;">📅 Upcoming (16-30 days)</h2>
                <p style="color: #854d0e; font-size: 14px; margin: 0 0 15px 0;">
                  <strong>${upcoming.length}</strong> item(s) expiring within a month.
                </p>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #fef08a;">
                      <th style="padding: 8px; text-align: left; font-size: 11px; color: #854d0e;">Drug</th>
                      <th style="padding: 8px; text-align: center; font-size: 11px; color: #854d0e;">Batch</th>
                      <th style="padding: 8px; text-align: center; font-size: 11px; color: #854d0e;">Stock</th>
                      <th style="padding: 8px; text-align: center; font-size: 11px; color: #854d0e;">Expires In</th>
                      <th style="padding: 8px; text-align: center; font-size: 11px; color: #854d0e;">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${upcoming
                      .slice(0, 10)
                      .map(
                        (drug) => `
                      <tr style="border-bottom: 1px solid #fef08a;">
                        <td style="padding: 8px; font-size: 12px;">
                          <strong>${drug.brandName}</strong><br/>
                          <span style="color: #6b7280; font-size: 10px;">${drug.category} | ${drug.sku}</span>
                        </td>
                        <td style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">
                          ${drug.batchNumber}
                        </td>
                        <td style="padding: 8px; text-align: center; font-size: 12px; color: #ca8a04;">
                          ${drug.currentStock}
                        </td>
                        <td style="padding: 8px; text-align: center; font-size: 12px; color: #ca8a04;">
                          ${drug.daysUntilExpiry} days
                        </td>
                        <td style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">
                          ${drug.expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    `
                      )
                      .join('')}
                    ${
                      upcoming.length > 10
                        ? `
                      <tr>
                        <td colspan="5" style="padding: 10px; text-align: center; font-size: 12px; color: #854d0e;">
                          + ${upcoming.length - 10} more item(s)
                        </td>
                      </tr>
                    `
                        : ''
                    }
                  </tbody>
                </table>
              </div>
            `
                : ''
            }

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; margin-top: 20px; border-radius: 8px;">
              <h3 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">💡 Recommended Actions</h3>
              <ul style="color: #1e3a8a; font-size: 13px; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Review critical items immediately and consider discounts for quick sale</li>
                <li style="margin-bottom: 8px;">Contact suppliers for return/exchange of near-expiry items</li>
                <li style="margin-bottom: 8px;">Update inventory ordering patterns to prevent future waste</li>
                <li style="margin-bottom: 8px;">Implement FEFO (First Expiry, First Out) system</li>
              </ul>
            </div>
          </div>

          <div style="background: #f1f5f9; padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              This is an automated daily expiry notification from <strong>${env.APP_NAME}</strong><br/>
              Report generated on ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} at ${new Date().toLocaleTimeString('en-US', { timeStyle: 'short' })}
            </p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'PharmaCare <onboarding@resend.dev>',
        to: process.env.ADMIN_EMAIL,
        subject: `⚠️ Daily Expiry Alert - ${expiringDrugs.length} Items Expiring Within 30 Days`,
        html: emailBody,
      });

      console.log(`✅ Expiry alert email sent to ${process.env.ADMIN_EMAIL}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to send expiry alert email:', error);
      return { success: false, error: String(error) };
    }
  }
}

export const emailService = EmailService;
