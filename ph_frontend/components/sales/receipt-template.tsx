'use client';

import React from 'react';
import type { Sale } from '@/lib/types';

interface ReceiptTemplateProps {
  sale: Sale;
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ sale }, ref) => {
    const items = sale.items || sale.saleItems || [];
    const receiptNo = sale.invoiceNumber || sale.id.slice(0, 12).toUpperCase();
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const saleDate = new Date(sale.createdAt || sale.saleDate);

    const handleDownload = () => {
      if (!ref || !('current' in ref) || !ref.current) return;

      const element = ref.current;
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${receiptNo}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: Courier New, monospace;
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
        <div className="no-print flex justify-center mb-4 gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded font-medium hover:bg-gray-800 transition"
            style={{
              padding: '10px 20px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            🖨️ Print Receipt
          </button>
        </div>

        {/* Receipt Container - Narrow and Centered */}
        <div
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            lineHeight: '1.5',
            width: '320px',
            margin: '0 auto 20px',
            padding: '20px',
            backgroundColor: 'white',
            color: 'black',
            textAlign: 'center',
            border: '1px solid #ddd',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '12px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginBottom: '4px',
              }}
            >
              PharmaCare
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
              Pharmacy Management System
            </div>
            <div
              style={{
                fontSize: '9px',
                borderTop: '1px solid #000',
                borderBottom: '1px solid #000',
                paddingTop: '6px',
                paddingBottom: '6px',
              }}
            >
              <div>Dundigal, Hyderabad, Telangana 500043</div>
              <div>Phone: 9652226061</div>
              <div>Email: ph@gmail.com</div>
              <div>GST: 29XXXXXX1234X1Z1</div>
            </div>
          </div>

          {/* Dashed Line */}
          <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }}></div>

          {/* Receipt Title */}
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
            SALES RECEIPT
          </div>

          {/* Dashed Line */}
          <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }}></div>

          {/* Details */}
          <div style={{ textAlign: 'left', fontSize: '10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Receipt:</span>
              <span style={{ fontWeight: 'bold' }}>{receiptNo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Date:</span>
              <span>{saleDate.toLocaleDateString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Time:</span>
              <span>
                {saleDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} am
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Customer:</span>
              <span>{sale.customer?.name || 'Walk-in Customer'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Cashier:</span>
              <span>{sale.user?.username || 'admin'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Reg:</span>
              <span>CRZ2RPD5</span>
            </div>
          </div>

          {/* Dashed Line */}
          <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }}></div>

          {/* Items Header */}
          <div
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid #000',
              paddingBottom: '4px',
            }}
          >
            <span>Item</span>
            <span>Qty Price</span>
          </div>

          {/* Items */}
          <div style={{ marginBottom: '8px', textAlign: 'left', fontSize: '10px' }}>
            {items.map((item) => {
              const itemTotal = item.quantity * (Number(item.unitPrice) || 0);
              const brandName = item.drug?.brandName || 'Unknown Product';
              const displayName =
                brandName.length > 15 ? brandName.substring(0, 12) + '...' : brandName;
              return (
                <div key={item.id} style={{ marginBottom: '4px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '2px',
                    }}
                  >
                    <span style={{ fontWeight: '500' }}>{displayName}</span>
                    <span>₹{itemTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ color: '#666', fontSize: '9px', paddingLeft: '4px' }}>
                    {item.quantity} x ₹{Number(item.unitPrice).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dashed Line */}
          <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }}></div>

          {/* Summary */}
          <div style={{ textAlign: 'left', fontSize: '10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Items:</span>
              <span style={{ fontWeight: 'bold' }}>{totalItems}</span>
            </div>
          </div>

          {/* Dashed Line */}
          <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }}></div>

          {/* Total */}
          <div
            style={{
              textAlign: 'left',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '8px',
              paddingTop: '6px',
              paddingBottom: '6px',
              borderTop: '2px solid #000',
              borderBottom: '2px solid #000',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TOTAL</span>
              <span>₹{Number(sale.totalAmount).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Box */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '10px',
              marginBottom: '8px',
              border: '1px solid #000',
              padding: '6px',
            }}
          >
            <div style={{ fontWeight: 'bold' }}>Payment: {sale.paymentMethod}</div>
            {sale.paymentMethod === 'CARD' && (
              <div style={{ fontSize: '9px', marginTop: '4px' }}>
                <div style={{ letterSpacing: '1px', marginBottom: '2px' }}>
                  |||| || |||| || || |||| ||
                </div>
                <div>Y2MGCR22RPD5</div>
              </div>
            )}
          </div>

          {/* Dashed Line */}
          <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }}></div>

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Thank you for your business!
            </div>
            <div style={{ marginBottom: '4px' }}>Get well soon! 💊</div>
            <div
              style={{
                fontSize: '9px',
                color: '#666',
                borderTop: '1px solid #000',
                paddingTop: '6px',
                marginTop: '6px',
              }}
            >
              <div>This is a computer-generated receipt</div>
              <div>No signature required</div>
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

ReceiptTemplate.displayName = 'ReceiptTemplate';
