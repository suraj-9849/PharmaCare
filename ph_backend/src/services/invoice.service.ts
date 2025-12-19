import OpenAI from 'openai';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

const openai = new OpenAI({
  apiKey: config.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5000',
    'X-Title': 'DrugDesk',
  },
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
  }>;
  totalAmount: number;
  gstAmount: number | null;
  confidence: number;
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
   * Extract invoice data using OpenRouter (gpt-oss-120b:free)
   */
  async extractInvoiceData(imageBuffer: Buffer, mimeType: string): Promise<InvoiceData> {
    const base64Image = imageBuffer.toString('base64');

    const completion = await openai.chat.completions.create({
      model: 'gpt-oss-120b:free',
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
      "category": "string or null (e.g., Analgesics, Antibiotics, Antihistamines, Gastrointestinal, Diabetes)"
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
- Category should be one of: Analgesics, Antibiotics, Antihistamines, Gastrointestinal, Diabetes, Cardiovascular, Vitamins, or "Other"`,
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
   * Match extracted drug name with existing drugs in database using OpenRouter (gpt-oss-120b:free)
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
      model: 'gpt-oss-120b:free',
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
   * Process and save invoice to database
   */
  async processInvoice(extractedData: InvoiceData, _verifiedBy: string) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

      // 2. Process each item
      const processedBatches = [];
      const newDrugsCreated = [];
      const matchedDrugs = [];

      for (const item of extractedData.items) {
        // Validate required fields
        if (!item.batchNumber || !item.unitPrice || !item.expiryDate) {
          console.warn(`Skipping item ${item.drugName} - missing required fields:`, {
            batchNumber: item.batchNumber,
            unitPrice: item.unitPrice,
            expiryDate: item.expiryDate,
          });
          continue; // Skip items with missing critical data
        }

        // Validate expiry date is valid
        const expiryDate = new Date(item.expiryDate);
        if (isNaN(expiryDate.getTime())) {
          console.warn(`Skipping item ${item.drugName} - invalid expiry date: ${item.expiryDate}`);
          continue;
        }

        // Match drug with existing or create new
        const matchResult = await this.matchDrug(item.drugName, item.genericName);

        let drugId = matchResult.matchedDrugId;

        // Create new drug if no match found
        if (matchResult.isNewDrug || !drugId) {
          const newDrug = await tx.drug.create({
            data: {
              brandName: matchResult.suggestedBrandName,
              genericName:
                matchResult.suggestedGenericName ||
                item.genericName ||
                matchResult.suggestedBrandName,
              category: item.category || 'Other',
              manufacturer: item.manufacturer || 'Unknown',
              requiresPrescription: false, // Default, can be updated later
              reorderLevel: 20, // Default reorder level
              sku: `SKU-${randomUUID()}`,
            },
          });
          drugId = newDrug.id;
          newDrugsCreated.push(newDrug);
        } else {
          matchedDrugs.push(matchResult.matchedDrugId);
        }

        // Calculate sell price with 30% markup (can be customized)
        const sellPrice = item.unitPrice * 1.3;

        // Create inventory batch
        const batchCreateData: Prisma.InventoryBatchCreateInput = {
          drug: {
            connect: { id: drugId! },
          },
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          purchasePrice: item.unitPrice,
          sellPrice,
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
      }

      return {
        supplier,
        batches: processedBatches,
        newDrugsCreated,
        matchedDrugsCount: matchedDrugs.length,
        totalItems: extractedData.items.length,
        totalAmount: extractedData.totalAmount,
      };
    });
  }
}
