import OpenAI from 'openai';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { Prisma } from '@prisma/client';

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY || '',
});

interface PrescriptionData {
  patientName: string | null;
  doctorName: string | null;
  prescriptionDate: string | null;
  medications: Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string | null;
  }>;
  confidence: number;
}

interface MedicationMatchResult {
  matchedDrugId: string | null;
  matchedDrugName: string;
  confidence: number;
  requiresPrescription: boolean;
  availableQuantity: number;
  isAvailable: boolean;
  alternativeSuggestions: string[];
}

type DrugWithBatches = Prisma.DrugGetPayload<{
  include: { inventoryBatches: true };
}>;

type InventoryBatch = Prisma.InventoryBatchGetPayload<Record<string, never>>;

interface AvailabilityResult {
  prescribedMedication: PrescriptionData['medications'][0];
  matchResult: MedicationMatchResult;
  availableBatches: InventoryBatch[];
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export class PrescriptionService {
  /**
   * Extract medications from prescription image using GPT-4o
   */
  async extractPrescriptionData(imageBuffer: Buffer, mimeType: string): Promise<PrescriptionData> {
    const base64Image = imageBuffer.toString('base64');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a pharmacist assistant analyzing a medical prescription.

Extract ALL medications from this prescription image and return valid JSON:

{
  "patientName": "string or null",
  "doctorName": "string or null",
  "prescriptionDate": "YYYY-MM-DD or null",
  "medications": [
    {
      "medicationName": "string (exact name from prescription)",
      "dosage": "string (e.g., 500mg, 10ml, 650mg)",
      "frequency": "string (e.g., twice daily, 3 times a day, once daily)",
      "duration": "string (e.g., 7 days, 2 weeks, 1 month)",
      "quantity": number (estimated tablets/units needed based on duration and frequency),
      "instructions": "string or null (any special instructions like 'after meals', 'before sleep')"
    }
  ],
  "confidence": number (0-100, overall extraction confidence)
}

Important instructions:
- Return ONLY valid JSON, no markdown formatting or code blocks
- For handwritten prescriptions, do your best to read the text - use your intelligence
- If unsure about a medication name, include it but note lower confidence
- Calculate quantity based on: (doses per day × duration in days)
- Common medical abbreviations:
  * BD/BID = twice daily (2 times)
  * TDS/TID = three times daily (3 times)
  * QID = four times daily (4 times)
  * OD = once daily (1 time)
  * HS = at bedtime
  * PRN = as needed
- If duration is in weeks, convert to days (1 week = 7 days)
- Be thorough and extract all medications visible in the image`,
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

    const extractedData: PrescriptionData = JSON.parse(cleanedText);

    return extractedData;
  }

  /**
   * Check availability of prescribed medications using GPT-4o for smart matching
   */
  async checkAvailability(
    medications: PrescriptionData['medications']
  ): Promise<AvailabilityResult[]> {
    const availabilityResults: AvailabilityResult[] = [];

    for (const med of medications) {
      // Get all drugs from database with their inventory batches
      let allDrugs: DrugWithBatches[] = [];

      try {
        console.log('Processing medication:', med.medicationName);

        try {
          // First, get ALL drugs to see what we have
          const allDrugsRaw = await prisma.drug.findMany({
            include: {
              inventoryBatches: true,
            },
          });
          console.log(`\n========== DATABASE INVENTORY ==========`);
          console.log(`Total drugs in DB: ${allDrugsRaw.length}`);
          allDrugsRaw.forEach((drug) => {
            console.log(`\n  Drug: ${drug.brandName} (Generic: ${drug.genericName})`);
            console.log(`  Batches: ${drug.inventoryBatches.length}`);
            drug.inventoryBatches.forEach((batch) => {
              const isExpired = new Date(batch.expiryDate) < new Date();
              console.log(`    - Batch ${batch.batchNumber}:`);
              console.log(`      Quantity: ${batch.quantity}`);
              console.log(
                `      Expiry: ${batch.expiryDate.toISOString().split('T')[0]} ${isExpired ? '(EXPIRED!)' : '(Valid)'}`
              );
            });
          });
          console.log(`========================================\n`);

          // Now filter for valid batches (quantity > 0 and not expired)
          allDrugs = await prisma.drug.findMany({
            include: {
              inventoryBatches: {
                where: {
                  quantity: { gt: 0 },
                  expiryDate: { gt: new Date() },
                },
                orderBy: { expiryDate: 'asc' },
              },
            },
          });
          // Filter to only include drugs that have at least one valid batch
          allDrugs = allDrugs.filter(
            (drug) => drug.inventoryBatches && drug.inventoryBatches.length > 0
          );
        } catch (dbError) {
          console.error('Database query error:', dbError);
          allDrugs = [];
        }

        console.log('Found drugs with valid stock:', allDrugs?.length || 0);

        // If no drugs in database, return OUT_OF_STOCK immediately
        if (!allDrugs || allDrugs.length === 0) {
          console.log('No drugs found, returning OUT_OF_STOCK');
          availabilityResults.push({
            prescribedMedication: med,
            matchResult: {
              matchedDrugId: null,
              matchedDrugName: med.medicationName,
              confidence: 0,
              requiresPrescription: false,
              availableQuantity: 0,
              isAvailable: false,
              alternativeSuggestions: [],
            },
            availableBatches: [],
            status: 'OUT_OF_STOCK',
          });
          continue;
        }
      } catch (medError) {
        console.error('Error processing medication:', medError);
        availabilityResults.push({
          prescribedMedication: med,
          matchResult: {
            matchedDrugId: null,
            matchedDrugName: med.medicationName,
            confidence: 0,
            requiresPrescription: false,
            availableQuantity: 0,
            isAvailable: false,
            alternativeSuggestions: [],
          },
          availableBatches: [],
          status: 'OUT_OF_STOCK',
        });
        continue;
      }

      // Use GPT-4o to intelligently match medication name with database drugs
      const matchPrompt = `You are a pharmacy expert matching prescribed medications with available stock.

Prescribed medication details:
- Name: "${med.medicationName}"
- Dosage: ${med.dosage}
- Requested quantity: ${med.quantity}

Available drugs in inventory:
${JSON.stringify(
  allDrugs.map((d) => ({
    id: d.id,
    brandName: d.brandName,
    genericName: d.genericName,
    requiresPrescription: d.requiresPrescription,
    manufacturer: d.manufacturer,
    availableQuantity: d.inventoryBatches.reduce(
      (sum: number, b: InventoryBatch) => sum + b.quantity,
      0
    ),
  })),
  null,
  2
)}

Return valid JSON:
{
  "matchedDrugId": "string or null (the id of the best matching drug)",
  "matchedDrugName": "string (the brand or generic name that matched)",
  "confidence": number (0-100, how confident you are in this match),
  "requiresPrescription": boolean,
  "availableQuantity": number (total quantity available),
  "isAvailable": boolean (true if availableQuantity >= ${med.quantity}),
  "alternativeSuggestions": ["array of alternative drug ids if exact match confidence is low, maximum 3 suggestions"]
}

Matching rules:
- Match based on active ingredient/generic name first (most important)
- Then consider brand name
- Consider dosage strength (e.g., "Paracetamol 500mg" vs "Paracetamol 650mg")
- If multiple matches, prefer the one with higher available quantity
- Return ONLY valid JSON, no markdown`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: matchPrompt,
          },
        ],
      });

      const matchText = completion.choices[0]?.message?.content || '';
      const cleanedMatch = matchText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const matchData: MedicationMatchResult = JSON.parse(cleanedMatch);

      // Get detailed batch info if matched
      let batches: InventoryBatch[] = [];
      if (matchData.matchedDrugId) {
        const drug = allDrugs.find((d) => d.id === matchData.matchedDrugId);
        if (drug && drug.inventoryBatches) {
          batches = drug.inventoryBatches;
        }
      }

      // Determine status
      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
      if (matchData.isAvailable) {
        status = 'IN_STOCK';
      } else if (matchData.availableQuantity > 0) {
        status = 'LOW_STOCK';
      } else {
        status = 'OUT_OF_STOCK';
      }

      availabilityResults.push({
        prescribedMedication: med,
        matchResult: matchData,
        availableBatches: batches,
        status,
      });
    }

    return availabilityResults;
  }

  /**
   * Process prescription purchase and automatically reduce stock
   */
  async processPurchase(
    prescriptionData: PrescriptionData,
    availabilityResults: AvailabilityResult[],
    paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'CREDIT',
    userId: string,
    customerId?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Validate all items are available before processing
      for (const result of availabilityResults) {
        if (result.status === 'OUT_OF_STOCK') {
          throw new Error(`${result.prescribedMedication.medicationName} is out of stock`);
        }
      }

      // Calculate total amount and prepare sale items
      let totalAmount = 0;
      const saleItems: Prisma.SaleItemCreateWithoutSaleInput[] = [];

      for (const result of availabilityResults) {
        const requestedQty = result.prescribedMedication.quantity;
        let remainingQty = requestedQty;

        // Allocate from batches using FEFO (First Expired, First Out)
        for (const batch of result.availableBatches) {
          if (remainingQty <= 0) break;

          const qtyFromBatch = Math.min(remainingQty, batch.quantity);
          const sellPrice = Number(batch.sellPrice);

          saleItems.push({
            drug: { connect: { id: result.matchResult.matchedDrugId! } },
            batch: { connect: { id: batch.id } },
            quantity: qtyFromBatch,
            unitPrice: sellPrice,
            subtotal: qtyFromBatch * sellPrice,
          });

          totalAmount += qtyFromBatch * sellPrice;
          remainingQty -= qtyFromBatch;

          // Update batch quantity (reduce stock)
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: { quantity: { decrement: qtyFromBatch } },
          });

          // Check if stock is low after decrement and create alert
          const updatedBatch = await tx.inventoryBatch.findUnique({
            where: { id: batch.id },
            include: { drug: true },
          });

          if (
            updatedBatch &&
            updatedBatch.quantity <= updatedBatch.drug.reorderLevel &&
            updatedBatch.quantity > 0
          ) {
            // Check if alert already exists
            const existingAlert = await tx.stockAlert.findFirst({
              where: {
                drugId: updatedBatch.drugId,
                alertType: 'LOW_STOCK',
                isRead: false,
              },
            });

            if (!existingAlert) {
              await tx.stockAlert.create({
                data: {
                  drugId: updatedBatch.drugId,
                  alertType: 'LOW_STOCK',
                  message: `${updatedBatch.drug.brandName} stock is low (${updatedBatch.quantity} units remaining)`,
                  isRead: false,
                },
              });
            }
          }
        }

        // Check if we fulfilled the entire quantity
        if (remainingQty > 0) {
          throw new Error(
            `Insufficient stock for ${result.prescribedMedication.medicationName}. Required: ${requestedQty}, Available: ${requestedQty - remainingQty}`
          );
        }
      }

      // Create sale record
      const saleCreateData: Prisma.SaleCreateInput = {
        user: {
          connect: { id: userId },
        },
        totalAmount,
        paymentMethod,
        status: 'COMPLETED',
        saleItems: {
          create: saleItems,
        },
      };

      if (customerId) {
        saleCreateData.customer = { connect: { id: customerId } };
      }

      const saleInclude: Prisma.SaleInclude = {
        saleItems: {
          include: {
            drug: true,
            batch: true,
          },
        },
      };

      if (customerId) {
        saleInclude.customer = true;
      }

      const sale = await tx.sale.create({
        data: saleCreateData,
        include: saleInclude,
      });

      return {
        sale,
        prescriptionData,
        itemsProcessed: availabilityResults.length,
        totalAmount,
      };
    });
  }
}
