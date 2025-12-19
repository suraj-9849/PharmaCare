'use client';

import React from 'react';
import type { Sale } from '@/lib/types';

interface InvoiceTemplateProps {
  sale: Sale;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ sale }, ref) => {
    const items = sale.items || sale.saleItems || [];
    const invoiceNo = sale.invoiceNumber || sale.id.slice(0, 12).toUpperCase();
    const subtotal =
      Number(sale.subtotal) ||
      items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
    const discount = Number(sale.discount) || 0;
    const total = Number(sale.totalAmount);
    const saleDate = new Date(sale.createdAt || sale.saleDate);

    const handlePrint = () => {
      if (!ref || !('current' in ref) || !ref.current) return;

      const element = ref.current;
      const printWindow = window.open('', '', 'width=1000,height=800');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${invoiceNo}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                  background-color: white;
                }
                @media print {
                  body {
                    margin: 0;
                    padding: 0;
                  }
                }
              </style>
            </head>
            <body>
              ${element.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();

        // Add a small delay before printing to ensure content is loaded
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          // Close after print dialog
          setTimeout(() => {
            printWindow.close();
          }, 100);
        }, 250);
      }
    };

    return (
      <div ref={ref}>
        {/* Print Button */}
        <div className="no-print flex justify-center mb-6">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition"
            style={{
              padding: '10px 20px',
              backgroundColor: '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            🖨️ Print Invoice
          </button>
        </div>

        {/* Invoice Container - Centered and Optimized */}
        <div
          className="flex justify-center items-start"
          style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}
        >
          <div
            className="bg-white shadow-lg"
            style={{ width: '700px', padding: '40px', fontFamily: 'Arial, sans-serif' }}
          >
            {/* Header */}
            <div
              className="flex justify-between items-start mb-8 pb-6 border-b-4"
              style={{ borderColor: '#059669' }}
            >
              <div>
                <h1 className="text-4xl font-bold text-emerald-600">DrugDesk</h1>
                <p className="text-sm text-gray-600 mt-1">Pharmacy Management System</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600 mb-2">INVOICE</div>
                <div className="text-sm text-gray-700">
                  <div>
                    Invoice #: <span className="font-bold">{invoiceNo}</span>
                  </div>
                  <div>Date: {saleDate.toLocaleDateString('en-IN')}</div>
                  <div>Time: {saleDate.toLocaleTimeString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Company and Customer Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-emerald-600 mb-3 text-sm">FROM:</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="font-bold text-base">DrugDesk</div>
                  <div>Dundigal, Hyderabad</div>
                  <div>Telangana 500043</div>
                  <div className="mt-2">
                    <div>Phone: 9652226061</div>
                    <div>Email: ph@gmail.com</div>
                  </div>
                  <div className="mt-2">
                    <div>GST: 29XXXXXX1234X1Z1</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-emerald-600 mb-3 text-sm">TO:</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="font-bold text-base">
                    {sale.customer?.name || 'Walk-in Customer'}
                  </div>
                  {sale.customer?.email && <div>{sale.customer.email}</div>}
                  {sale.customer?.phone && <div>{sale.customer.phone}</div>}
                  {sale.customer?.address && <div>{sale.customer.address}</div>}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="mb-6 text-sm bg-gray-50 p-4 rounded border border-gray-200">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-gray-600 text-xs font-semibold">PAYMENT METHOD</div>
                  <div className="font-bold text-sm">{sale.paymentMethod}</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs font-semibold">CASHIER</div>
                  <div className="font-bold text-sm">{sale.user?.username || 'admin'}</div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs font-semibold">STATUS</div>
                  <div className="font-bold text-sm text-emerald-600">
                    {sale.status || 'COMPLETED'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 text-xs font-semibold">TOTAL ITEMS</div>
                  <div className="font-bold text-sm">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-6 text-sm">
              <thead>
                <tr style={{ borderBottom: '2px solid #059669' }}>
                  <th className="text-left py-3 font-bold text-gray-800">Product Name</th>
                  <th className="text-center py-3 font-bold text-gray-800">Qty</th>
                  <th className="text-right py-3 font-bold text-gray-800">Unit Price</th>
                  <th className="text-right py-3 font-bold text-gray-800">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const itemTotal = item.quantity * (Number(item.unitPrice) || 0);
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-200"
                      style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}
                    >
                      <td className="py-3 text-gray-700">
                        {item.drug?.brandName || 'Unknown Product'}
                      </td>
                      <td className="text-center py-3 text-gray-700">{item.quantity}</td>
                      <td className="text-right py-3 text-gray-700">
                        ₹{Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="text-right py-3 font-semibold text-gray-800">
                        ₹{itemTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals Section */}
            <div className="flex justify-end mb-6">
              <div className="w-80">
                <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Discount:</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-base font-bold text-emerald-600">
                    <span>Total Amount:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  {sale.paymentMethod === 'CASH' && sale.cashReceived && (
                    <>
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-gray-700">Cash Received:</span>
                        <span className="font-semibold text-gray-800">
                          ₹{Number(sale.cashReceived).toFixed(2)}
                        </span>
                      </div>
                      {sale.changeGiven !== undefined && (
                        <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                          <span>Change:</span>
                          <span>₹{Number(sale.changeGiven).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Notes and Footer */}
            <div
              className="border-t-2 pt-4 text-center text-xs text-gray-600 space-y-2"
              style={{ borderColor: '#059669' }}
            >
              {sale.status === 'COMPLETED' && (
                <div className="text-emerald-600 font-bold mb-3">✓ Payment Received</div>
              )}
              <div className="font-semibold">Thank you for your business!</div>
              <div>Please visit again for all your medical needs.</div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div>This is a computer-generated invoice. No signature required.</div>
                <div className="text-gray-400 text-xs">
                  Invoice generated on {new Date().toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
              background-color: white;
            }
            .no-print {
              display: none !important;
            }
            * {
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
