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
        from: 'DrugDesk <onboarding@resend.dev>',
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
        from: 'DrugDesk <onboarding@resend.dev>',
        to: process.env.ADMIN_EMAIL,
        subject: ` URGENT: ${drugs.length} Items Out of Stock`,
        html: emailBody,
      });

      console.log(` Out of stock alert email sent to ${process.env.ADMIN_EMAIL}`);
    } catch (error) {
      console.error('Failed to send out of stock email:', error);
    }
  }
}

export const emailService = EmailService;
