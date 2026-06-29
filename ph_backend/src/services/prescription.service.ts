import OpenAI from 'openai';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { Prisma } from '@prisma/client';
import { sendSaleNotification, sendLowStockNotification } from './firebase.service';
import { emailService } from './email.service';

// OpenAI client for prescription analysis
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
   * Extract medications from prescription image using OpenRouter vision model
   */
  async extractPrescriptionData(imageBuffer: Buffer, mimeType: string): Promise<PrescriptionData> {
    try {
      console.log('Starting prescription extraction...');
      console.log('Image buffer size:', imageBuffer.length, 'bytes');
      console.log('MIME type:', mimeType);

      const base64Image = imageBuffer.toString('base64');

      // Use OpenAI GPT-4 Vision for prescription analysis
      console.log('Analyzing prescription with OpenAI GPT-4 Vision...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // OpenAI GPT-4o-mini (supports vision and is cost-effective)
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a pharmacist assistant analyzing a medical prescription image.

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
- For handwritten prescriptions, do your best to interpret unclear text
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
      console.log('LLM response preview:', text.substring(0, 200));

      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const extractedData: PrescriptionData = JSON.parse(cleanedText);
      console.log('Successfully parsed prescription data');
      console.log('Medications found:', extractedData.medications.length);

      return extractedData;
    } catch (error) {
      console.error('Error in extractPrescriptionData:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to extract prescription data: ${error.message}`, { cause: error });
      }
      throw error;
    }
  }

  /**
   * Check availability of prescribed medications using OpenRouter (google/gemini-2.0-flash-exp:free) for smart matching
   */
  async checkAvailability(
    medications: PrescriptionData['medications']
  ): Promise<AvailabilityResult[]> {
    const availabilityResults: AvailabilityResult[] = [];

    for (const med of medications) {
      // Get all drugs from database with their inventory batches
      let allDrugs: DrugWithBatches[];

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

      // Use OpenRouter (google/gemini-2.0-flash-exp:free) to intelligently match medication name with database drugs
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
        model: 'gpt-4o-mini', // OpenAI GPT-4o-mini for medication matching
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

      // Get detailed batch info if matched, sorted by FEFO (First Expired, First Out)
      let batches: InventoryBatch[] = [];
      if (matchData.matchedDrugId) {
        const batchesWithLocation = await prisma.inventoryBatch.findMany({
          where: {
            drugId: matchData.matchedDrugId,
            quantity: { gt: 0 },
          },
          include: {
            drug: true,
            shelfLocation: true,
          },
          orderBy: {
            expiryDate: 'asc', // FEFO: Sort by expiry date (earliest first)
          },
        });
        batches = batchesWithLocation as any[];
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
   * Process prescription purchase with user-selected batches (FEFO enforced)
   */
  async processPurchase(
    prescriptionData: PrescriptionData,
    availabilityResults: AvailabilityResult[],
    paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'CREDIT',
    userId: string,
    selectedBatches?: Array<{ medicationName: string; batchId: string; quantity: number }>,
    customerId?: string,
    customerName?: string,
    customerPhone?: string,
    customerEmail?: string,
    customerAddress?: string
  ) {
    const result = await prisma.$transaction(
      async (tx) => {
        // Validate all items are available before processing
        for (const result of availabilityResults) {
          if (result.status === 'OUT_OF_STOCK') {
            throw new Error(`${result.prescribedMedication.medicationName} is out of stock`);
          }
        }

        // Handle customer - either use existing ID or create/update new one
        let finalCustomerId = customerId;
        if (customerName && !customerId) {
          // Check if customer with this phone exists
          if (customerPhone) {
            const existingCustomer = await tx.customer.findFirst({
              where: { phone: customerPhone },
            });
            if (existingCustomer) {
              finalCustomerId = existingCustomer.id;
            } else {
              // Create new customer
              const newCustomer = await tx.customer.create({
                data: {
                  name: customerName,
                  phone: customerPhone,
                  email: customerEmail || '',
                  address: customerAddress || '',
                },
              });
              finalCustomerId = newCustomer.id;
            }
          } else {
            // Create new customer with just name and email
            const newCustomer = await tx.customer.create({
              data: {
                name: customerName,
                phone: '',
                email: customerEmail || '',
                address: customerAddress || '',
              },
            });
            finalCustomerId = newCustomer.id;
          }
        }

        // Calculate total amount and prepare sale items
        let totalAmount = 0;
        const saleItems: Prisma.SaleItemCreateWithoutSaleInput[] = [];
        const lowStockAlerts: Array<{ name: string; quantity: number }> = [];
        const processedDrugs = new Set<string>(); // Track drugs to avoid duplicate alerts

        // If selectedBatches is provided, use user selections (FEFO-compliant from frontend)
        if (selectedBatches && selectedBatches.length > 0) {
          // Use user-selected batches
          for (const selection of selectedBatches) {
            const batch = await tx.inventoryBatch.findUnique({
              where: { id: selection.batchId },
              include: { drug: true },
            });

            if (!batch) {
              throw new Error(`Batch ${selection.batchId} not found`);
            }

            if (batch.quantity < selection.quantity) {
              throw new Error(
                `Insufficient stock in batch ${batch.batchNumber}. Available: ${batch.quantity}, Requested: ${selection.quantity}`
              );
            }

            const sellPrice = Number(batch.sellPrice);

            saleItems.push({
              drug: { connect: { id: batch.drugId } },
              batch: { connect: { id: batch.id } },
              quantity: selection.quantity,
              unitPrice: sellPrice,
              subtotal: selection.quantity * sellPrice,
            });

            totalAmount += selection.quantity * sellPrice;

            // Update batch quantity (reduce stock)
            await tx.inventoryBatch.update({
              where: { id: batch.id },
              data: { quantity: { decrement: selection.quantity } },
            });

            // Check if stock is low after decrement (only once per drug)
            if (!processedDrugs.has(batch.drugId)) {
              processedDrugs.add(batch.drugId);

              const remainingQty = batch.quantity - selection.quantity;

              // Calculate total stock across all batches for this drug
              const allDrugBatches = await tx.inventoryBatch.findMany({
                where: { drugId: batch.drugId },
              });
              const totalDrugStock = allDrugBatches.reduce((sum, b) => {
                if (b.id === batch.id) {
                  return sum + remainingQty; // Use updated quantity for current batch
                }
                return sum + b.quantity;
              }, 0);

              console.log(
                `📊 Stock check for ${batch.drug.brandName}: ${totalDrugStock} units (reorder level: ${batch.drug.reorderLevel})`
              );

              if (totalDrugStock <= batch.drug.reorderLevel && totalDrugStock > 0) {
                const existingAlert = await tx.stockAlert.findFirst({
                  where: {
                    drugId: batch.drugId,
                    alertType: 'LOW_STOCK',
                    isRead: false,
                  },
                });

                if (!existingAlert) {
                  await tx.stockAlert.create({
                    data: {
                      drugId: batch.drugId,
                      alertType: 'LOW_STOCK',
                      message: `${batch.drug.brandName} stock is low (${totalDrugStock} units remaining, reorder level: ${batch.drug.reorderLevel})`,
                      isRead: false,
                      notificationSent: false,
                    },
                  });
                  console.log(`⚠️ LOW_STOCK alert created for ${batch.drug.brandName}`);
                }

                // Track for notification
                lowStockAlerts.push({
                  name: batch.drug.brandName,
                  quantity: totalDrugStock,
                });
              } else if (totalDrugStock === 0) {
                // Out of stock alert
                const existingAlert = await tx.stockAlert.findFirst({
                  where: {
                    drugId: batch.drugId,
                    alertType: 'OUT_OF_STOCK',
                    isRead: false,
                  },
                });

                if (!existingAlert) {
                  await tx.stockAlert.create({
                    data: {
                      drugId: batch.drugId,
                      alertType: 'OUT_OF_STOCK',
                      message: `${batch.drug.brandName} is out of stock. Please reorder immediately.`,
                      isRead: false,
                      notificationSent: false,
                    },
                  });
                  console.log(`🚨 OUT_OF_STOCK alert created for ${batch.drug.brandName}`);
                }

                lowStockAlerts.push({
                  name: batch.drug.brandName,
                  quantity: 0,
                });
              }
            }
          }
        } else {
          // Fallback: Auto-allocate from batches using FEFO (First Expired, First Out)
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
                      notificationSent: false,
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

        if (finalCustomerId) {
          saleCreateData.customer = { connect: { id: finalCustomerId } };
        }

        const saleInclude: Prisma.SaleInclude = {
          saleItems: {
            include: {
              drug: true,
              batch: true,
            },
          },
        };

        if (finalCustomerId) {
          saleInclude.customer = true;
        }

        const sale = await tx.sale.create({
          data: saleCreateData,
          include: saleInclude,
        });

        // Create prescription history record
        const medicationsJson = JSON.stringify(
          availabilityResults.map((result) => ({
            medicationName: result.prescribedMedication.medicationName,
            dosage: result.prescribedMedication.dosage,
            frequency: result.prescribedMedication.frequency,
            duration: result.prescribedMedication.duration,
            quantity: result.prescribedMedication.quantity,
            instructions: result.prescribedMedication.instructions,
          }))
        );

        await tx.prescriptionHistory.create({
          data: {
            saleId: sale.id,
            patientName: prescriptionData.patientName || 'N/A',
            doctorName: prescriptionData.doctorName || null,
            prescriptionDate: prescriptionData.prescriptionDate
              ? new Date(prescriptionData.prescriptionDate)
              : null,
            medications: medicationsJson,
            totalAmount,
            paymentMethod,
            customerName: customerName || 'N/A',
            customerPhone: customerPhone || null,
            customerEmail: customerEmail || null,
            customerAddress: customerAddress || null,
            confidence: prescriptionData.confidence,
          },
        });

        return {
          sale,
          prescriptionData,
          itemsProcessed: availabilityResults.length,
          totalAmount,
          lowStockAlerts,
        };
      },
      {
        timeout: 15000, // Increase timeout to 15 seconds for prescription processing
      }
    );

    // Send Firebase notifications (async, don't block the response)
    console.log(`📢 Preparing notifications: ${result.lowStockAlerts.length} low stock items`);

    // 1. Send prescription sale completed notification
    sendSaleNotification({
      saleId: result.sale.id,
      totalAmount: Number(result.totalAmount),
      itemCount: result.sale.saleItems.length,
      lowStockItems: result.lowStockAlerts.map((item) => item.name),
    }).catch((err) => {
      console.error('Failed to send prescription sale notification:', err);
    });

    // 2. Send low stock notification if applicable
    if (result.lowStockAlerts.length > 0) {
      console.log(
        `🔔 Sending low stock notification for: ${result.lowStockAlerts.map((i) => `${i.name} (${i.quantity})`).join(', ')}`
      );
      sendLowStockNotification(result.lowStockAlerts).catch((err) => {
        console.error('Failed to send low stock notification:', err);
      });

      // Send email alerts for low stock
      const lowStockEmailData = result.lowStockAlerts
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          drugName: item.name,
          brandName: item.name,
          currentStock: item.quantity,
          reorderLevel: 0, // We don't have this info here, but it's logged in the alert
          stockPercentage: 0,
          category: 'N/A',
          sku: 'N/A',
        }));

      if (lowStockEmailData.length > 0) {
        emailService.sendLowStockAlert(lowStockEmailData).catch((err) => {
          console.error('Failed to send low stock email:', err);
        });
      }

      // Send email for out of stock items
      const outOfStockEmailData = result.lowStockAlerts
        .filter((item) => item.quantity === 0)
        .map((item) => ({
          drugName: item.name,
          brandName: item.name,
          currentStock: 0,
          reorderLevel: 0,
          stockPercentage: 0,
          category: 'N/A',
          sku: 'N/A',
        }));

      if (outOfStockEmailData.length > 0) {
        emailService.sendOutOfStockAlert(outOfStockEmailData).catch((err) => {
          console.error('Failed to send out of stock email:', err);
        });
      }
    }

    return result;
  }
}
