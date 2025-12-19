import * as XLSX from 'xlsx';
import type { Sale, SaleItem, InventoryBatch, Drug } from './types';

/**
 * Export sales data to Excel
 */
export const exportSalesToExcel = (sales: Sale[], filename: string = 'sales.xlsx') => {
  try {
    // Prepare sales data
    const salesData = sales.map((sale) => ({
      'Sale ID': sale.id,
      Date: sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '',
      'Total Amount': sale.totalAmount,
      'Payment Method': sale.paymentMethod,
      Status: sale.status,
      'Items Count': sale.saleItems?.length || 0,
      Discount: sale.discount || 0,
      Subtotal: sale.subtotal || 0,
      Notes: sale.notes || '',
    }));

    // Prepare sale items data (detailed)
    const itemsData = sales.flatMap((sale) =>
      (sale.saleItems || []).map((item: SaleItem) => ({
        'Sale ID': sale.id,
        'Drug Name': item.drug?.brandName || '',
        'Generic Name': item.drug?.genericName || '',
        Quantity: item.quantity,
        'Unit Price': item.unitPrice,
        'Total Price': item.subtotal,
        'Batch Number': item.batch?.batchNumber || '',
      }))
    );

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Add sales summary sheet
    const salesSheet = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales Summary');

    // Add detailed items sheet
    const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Sale Items');

    // Write file
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting sales to Excel:', error);
    throw error;
  }
};

/**
 * Export inventory data to Excel
 */
export const exportInventoryToExcel = (
  inventoryBatches: InventoryBatch[],
  filename: string = 'inventory.xlsx'
) => {
  try {
    const inventoryData = inventoryBatches.map((batch) => ({
      'Batch ID': batch.id,
      'Drug Name': batch.drug?.brandName || '',
      'Generic Name': batch.drug?.genericName || '',
      Category: batch.drug?.category || '',
      'Batch Number': batch.batchNumber,
      Quantity: batch.quantity,
      'Purchase Price': batch.purchasePrice,
      'Sell Price': batch.sellPrice,
      'Expiry Date': batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : '',
      'Date Added': batch.dateAdded ? new Date(batch.dateAdded).toLocaleDateString() : '',
      Supplier: batch.supplier?.supplierName || 'N/A',
      Location: batch.location || 'N/A',
      'Shelf Location': batch.shelfLocationId || 'N/A',
      'Days to Expiry': batch.expiryDate
        ? Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 'N/A',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(inventoryData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting inventory to Excel:', error);
    throw error;
  }
};

/**
 * Export drugs data to Excel
 */
export const exportDrugsToExcel = (drugs: Drug[], filename: string = 'drugs.xlsx') => {
  try {
    const drugsData = drugs.map((drug) => ({
      'Drug ID': drug.id,
      'Brand Name': drug.brandName,
      'Generic Name': drug.genericName,
      Category: drug.category,
      Manufacturer: drug.manufacturer,
      Strength: drug.strength || 'N/A',
      'Dosage Form': drug.dosageForm || 'N/A',
      SKU: drug.sku,
      'Requires Prescription': drug.requiresPrescription ? 'Yes' : 'No',
      'Reorder Level': drug.reorderLevel,
      'Created Date': new Date(drug.createdAt).toLocaleDateString(),
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(drugsData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Drugs');
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting drugs to Excel:', error);
    throw error;
  }
};

/**
 * Generate filename with timestamp
 */
export const generateFilename = (name: string): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${name}_${timestamp}.xlsx`;
};
