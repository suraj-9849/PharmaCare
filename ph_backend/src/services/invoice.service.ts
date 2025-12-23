import OpenAI from 'openai';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

// OpenAI client for invoice processing
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY || '',
});

interface InvoiceData {
  invoiceNumber: string | null;
  invoiceDate: string | null;
  supplier: {
    name: string;
    contactNumber: string | null;
    email: string | null;
    address: string | null;
  } | null;
  items: Array<{
    drugName: string;
    genericName: string | null;
    batchNumber: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    expiryDate: string;
    manufacturer: string | null;
    category: string | null;
    dosage: string | null;
  }>;
  totalAmount: number;
  gstAmount: number | null;
  confidence: number;
}

interface InvoiceItem {
  drugName: string;
  genericName: string | null;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  sellPrice: number;
  expiryDate: string;
  manufacturer: string | null;
  category: string | null;
  dosage: string | null;
}

interface MissingFieldsInfo {
  hasMissingFields: boolean;
  itemsWithMissingFields: Array<{
    itemIndex: number;
    drugName: string;
    missingFields: string[];
  }>;
}

interface ValidationResult {
  isValid: boolean;
  missingFieldsInfo: MissingFieldsInfo;
  validatedItems: InvoiceItem[];
}

interface NewDrugData {
  brandName: string;
  genericName: string;
  category: string;
  manufacturer: string;
  dosage: string | null;
  chemicalName: string | null;
  requiresPrescription: boolean;
  reorderLevel: number;
}

interface DrugMatchResult {
  matchedDrugId: string | null;
  confidence: number;
  isNewDrug: boolean;
  suggestedBrandName: string;
  suggestedGenericName: string | null;
}

export class InvoiceService {
  /**
   * Extract invoice data using OpenAI GPT-4o-mini
   */
  async extractInvoiceData(imageBuffer: Buffer, mimeType: string): Promise<InvoiceData> {
    const base64Image = imageBuffer.toString('base64');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // OpenAI GPT-4o-mini for invoice processing
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert at extracting structured data from pharmacy supplier invoices.

Analyze this invoice image and extract the following information in valid JSON format:

{
  "invoiceNumber": "string or null",
  "invoiceDate": "YYYY-MM-DD or null",
  "supplier": {
    "name": "string",
    "contactNumber": "string or null",
    "email": "string or null",
    "address": "string or null"
  } or null,
  "items": [
    {
      "drugName": "string (brand name)",
      "genericName": "string or null",
      "batchNumber": "string",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number,
      "expiryDate": "YYYY-MM-DD",
      "manufacturer": "string or null",
      "category": "string or null (e.g., Analgesics, Antibiotics, Antihistamines, Gastrointestinal, Diabetes)",
      "dosage": "string or null (e.g., 500mg, 10mg/ml)"
    }
  ],
  "totalAmount": number,
  "gstAmount": number or null,
  "confidence": number (0-100, your confidence in extraction accuracy)
}

Important rules:
- Return ONLY valid JSON, no markdown formatting or code blocks
- If a field is not found, use null
- Ensure dates are in YYYY-MM-DD format
- Quantity and prices must be numbers (not strings)
- Be precise with batch numbers and expiry dates as these are critical
- Drug names should be the brand names as written on the invoice
- Category should be one of: Analgesics, Antibiotics, Antihistamines, Gastrointestinal, Diabetes, Cardiovascular, Vitamins, or "Other"
- Dosage should include strength and unit (e.g., 500mg, 10mg/ml, 250mg/5ml)`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || '';
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const extractedData: InvoiceData = JSON.parse(cleanedText);

    return extractedData;
  }

  /**
   * Match extracted drug name with existing drugs in database using OpenAI GPT-4o-mini
   */
  async matchDrug(extractedName: string, genericName?: string | null): Promise<DrugMatchResult> {
    // Get existing drugs from database
    const existingDrugs = await prisma.drug.findMany({
      select: {
        id: true,
        brandName: true,
        genericName: true,
        manufacturer: true,
      },
    });

    const prompt = `You are a pharmacy expert matching drug names.

Given this extracted drug name: "${extractedName}" ${genericName ? `(generic: ${genericName})` : ''}

Find the best match from this list of existing drugs in the database:
${JSON.stringify(existingDrugs, null, 2)}

Return valid JSON with:
{
  "matchedDrugId": "string or null (the id of the matched drug)",
  "confidence": number (0-100, how confident you are in this match),
  "isNewDrug": boolean (true if no good match found),
  "suggestedBrandName": "string (cleaned up brand name)",
  "suggestedGenericName": "string or null (generic name if you can infer it)"
}

Matching rules:
- Match based on brand name OR generic name
- Consider common abbreviations (e.g., "Paracet" matches "Paracetamol")
- Consider spelling variations
- If confidence is below 70%, set isNewDrug to true
- Return ONLY valid JSON, no markdown`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // OpenAI GPT-4o-mini for drug matching
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || '';
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const matchResult: DrugMatchResult = JSON.parse(cleanedText);

    return matchResult;
  }

  /**
   * Validate invoice items for missing required fields
   */
  validateInvoiceItems(extractedData: InvoiceData): ValidationResult {
    const requiredFields = ['drugName', 'batchNumber', 'quantity', 'unitPrice', 'expiryDate'];
    const itemsWithMissingFields: Array<{
      itemIndex: number;
      drugName: string;
      missingFields: string[];
    }> = [];
    const validatedItems: InvoiceItem[] = [];

    extractedData.items.forEach((item, index) => {
      const missingFields: string[] = [];

      // Check required fields
      if (!item.drugName || item.drugName.trim() === '') missingFields.push('drugName');
      if (!item.batchNumber || item.batchNumber.trim() === '') missingFields.push('batchNumber');
      if (!item.quantity || item.quantity <= 0) missingFields.push('quantity');
      if (!item.unitPrice || item.unitPrice <= 0) missingFields.push('unitPrice');
      if (!item.expiryDate || item.expiryDate.trim() === '') missingFields.push('expiryDate');

      // Validate expiry date format
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        if (isNaN(expiryDate.getTime())) {
          missingFields.push('expiryDate (invalid format)');
        }
      }

      if (missingFields.length > 0) {
        itemsWithMissingFields.push({
          itemIndex: index,
          drugName: item.drugName || `Item ${index + 1}`,
          missingFields,
        });
      } else {
        // Calculate sell price with 30% markup if not provided
        const sellPrice = item.unitPrice * 1.3;

        validatedItems.push({
          drugName: item.drugName,
          genericName: item.genericName,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sellPrice,
          expiryDate: item.expiryDate,
          manufacturer: item.manufacturer,
          category: item.category,
          dosage: item.dosage,
        });
      }
    });

    return {
      isValid: itemsWithMissingFields.length === 0,
      missingFieldsInfo: {
        hasMissingFields: itemsWithMissingFields.length > 0,
        itemsWithMissingFields,
      },
      validatedItems,
    };
  }

  /**
   * Create a new drug in the database
   */
  async createNewDrug(drugData: NewDrugData) {
    return await prisma.drug.create({
      data: {
        brandName: drugData.brandName,
        genericName: drugData.genericName,
        category: drugData.category,
        manufacturer: drugData.manufacturer,
        dosage: drugData.dosage,
        chemicalName: drugData.chemicalName,
        requiresPrescription: drugData.requiresPrescription,
        reorderLevel: drugData.reorderLevel,
        sku: `SKU-${randomUUID()}`,
      },
    });
  }

  /**
   * Process and save invoice to database (only with validated items)
   */
  /**
   * Process and save invoice to database (only with validated items)
   */
  async processInvoice(
    extractedData: InvoiceData,
    _verifiedBy: string,
    updatedItems?: InvoiceItem[]
  ) {
    // Use updated items if provided, otherwise validate extracted items
    let itemsToProcess: InvoiceItem[];

    if (updatedItems && updatedItems.length > 0) {
      itemsToProcess = updatedItems;
    } else {
      const validation = this.validateInvoiceItems(extractedData);
      if (!validation.isValid) {
        throw new Error(
          `Cannot process invoice: Missing required fields in ${validation.missingFieldsInfo.itemsWithMissingFields.length} items`
        );
      }
      itemsToProcess = validation.validatedItems;
    }

    return await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1. Upsert supplier if provided
        let supplier;
        if (extractedData.supplier && extractedData.supplier.name) {
          const supplierEmail =
            extractedData.supplier.email ||
            `${extractedData.supplier.name.toLowerCase().replace(/\s+/g, '')}@supplier.com`;

          supplier = await tx.supplier.upsert({
            where: { email: supplierEmail },
            update: {
              supplierName: extractedData.supplier.name,
              contactNumber: extractedData.supplier.contactNumber || undefined,
              address: extractedData.supplier.address || null,
            },
            create: {
              supplierName: extractedData.supplier.name,
              contactNumber: extractedData.supplier.contactNumber || 'N/A',
              email: supplierEmail,
              address: extractedData.supplier.address || null,
            },
          });
        }

        // 2. Process each validated item
        const processedBatches: any[] = [];
        const newDrugsCreated: any[] = [];
        const matchedDrugs: string[] = [];
        const skippedItems: Array<{
          drugName: string;
          reason: string;
          suggestion?: {
            brandName: string;
            genericName: string;
          };
        }> = [];

        for (const item of itemsToProcess) {
          try {
            // Match drug with existing or get suggestion for new drug
            const matchResult = await this.matchDrug(item.drugName, item.genericName);

            let drugId = matchResult.matchedDrugId;

            // If no match found and it's a new drug, skip it - user needs to create drug manually
            if (matchResult.isNewDrug || !drugId) {
              skippedItems.push({
                drugName: item.drugName,
                reason: 'Drug not found in database. Please create drug entry first.',
                suggestion: {
                  brandName: matchResult.suggestedBrandName,
                  genericName: matchResult.suggestedGenericName || '',
                },
              });
              continue;
            } else {
              matchedDrugs.push(matchResult.matchedDrugId || '');
            }

            // Validate expiry date
            const expiryDate = new Date(item.expiryDate);
            if (isNaN(expiryDate.getTime())) {
              skippedItems.push({
                drugName: item.drugName,
                reason: `Invalid expiry date: ${item.expiryDate}`,
              });
              continue;
            }

            // Create inventory batch
            const batchCreateData: Prisma.InventoryBatchCreateInput = {
              drug: {
                connect: { id: drugId! },
              },
              batchNumber: item.batchNumber,
              quantity: item.quantity,
              purchasePrice: item.unitPrice,
              sellPrice: item.sellPrice,
              expiryDate,
              location: 'Pending Assignment', // Can be updated later
            };

            if (supplier) {
              batchCreateData.supplier = { connect: { id: supplier.id } };
            }

            const batch = await tx.inventoryBatch.create({
              data: batchCreateData,
            });

            processedBatches.push(batch);
          } catch (error) {
            console.error(`Error processing item ${item.drugName}:`, error);
            skippedItems.push({
              drugName: item.drugName,
              reason: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        return {
          supplier,
          batches: processedBatches,
          newDrugsCreated,
          matchedDrugsCount: matchedDrugs.length,
          skippedItems,
          totalItemsProcessed: processedBatches.length,
          totalItemsSkipped: skippedItems.length,
          totalAmount: extractedData.totalAmount,
        };
      },
      {
        timeout: 60000, // 60 seconds for invoice processing with AI/DB operations
        maxWait: 60000,
      }
    );
  }
}
