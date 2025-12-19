import { prisma } from '../config/database';
import type { PrescriptionHistory } from '@prisma/client';

interface CreatePrescriptionHistoryRequest {
  saleId: string;
  patientName: string;
  doctorName?: string;
  prescriptionDate?: string;
  medications: string; // JSON string
  totalAmount: number;
  paymentMethod: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
  confidence?: number;
}

interface Medication {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string | null;
}

/**
 * Parse medications from JSON string to array
 */
function parseMedications(medicationsStr: string): Medication[] {
  try {
    const parsed = JSON.parse(medicationsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error('Failed to parse medications:', medicationsStr);
    return [];
  }
}

interface FormattedPrescriptionHistory extends Omit<PrescriptionHistory, 'medications'> {
  medications: Medication[];
}

/**
 * Format prescription history record with parsed medications
 */
function formatPrescriptionHistory(record: PrescriptionHistory): FormattedPrescriptionHistory {
  return {
    ...record,
    medications: parseMedications(record.medications),
  };
}

export const prescriptionHistoryService = {
  /**
   * Create prescription history
   */
  async createPrescriptionHistory(
    data: CreatePrescriptionHistoryRequest
  ): Promise<PrescriptionHistory> {
    return prisma.prescriptionHistory.create({
      data: {
        saleId: data.saleId,
        patientName: data.patientName,
        doctorName: data.doctorName,
        prescriptionDate: data.prescriptionDate ? new Date(data.prescriptionDate) : null,
        medications: data.medications,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        customerAddress: data.customerAddress,
        notes: data.notes,
        confidence: data.confidence,
      },
    });
  },

  /**
   * Get all prescription histories with pagination
   */
  async getAllPrescriptionHistories(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const total = await prisma.prescriptionHistory.count();

    const histories = await prisma.prescriptionHistory.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sale: {
          select: {
            id: true,
            totalAmount: true,
            paymentMethod: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      histories: histories.map(formatPrescriptionHistory),
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  },

  /**
   * Get prescription history by ID
   */
  async getPrescriptionHistoryById(id: string): Promise<FormattedPrescriptionHistory | null> {
    const record = await prisma.prescriptionHistory.findUnique({
      where: { id },
      include: {
        sale: {
          select: {
            id: true,
            totalAmount: true,
            paymentMethod: true,
            createdAt: true,
            saleItems: {
              select: {
                id: true,
                drugId: true,
                quantity: true,
                unitPrice: true,
                subtotal: true,
              },
            },
          },
        },
      },
    });

    return record ? formatPrescriptionHistory(record) : null;
  },

  /**
   * Search prescription histories
   */
  async searchPrescriptionHistories(query: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const total = await prisma.prescriptionHistory.count({
      where: {
        OR: [
          { patientName: { contains: query, mode: 'insensitive' } },
          { doctorName: { contains: query, mode: 'insensitive' } },
          { customerName: { contains: query, mode: 'insensitive' } },
          { id: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    const histories = await prisma.prescriptionHistory.findMany({
      where: {
        OR: [
          { patientName: { contains: query, mode: 'insensitive' } },
          { doctorName: { contains: query, mode: 'insensitive' } },
          { customerName: { contains: query, mode: 'insensitive' } },
          { id: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      histories: histories.map(formatPrescriptionHistory),
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  },

  /**
   * Get prescription histories by patient name
   */
  async getPrescriptionHistoriesByPatient(
    patientName: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const total = await prisma.prescriptionHistory.count({
      where: {
        patientName: { contains: patientName, mode: 'insensitive' },
      },
    });

    const histories = await prisma.prescriptionHistory.findMany({
      where: {
        patientName: { contains: patientName, mode: 'insensitive' },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      histories: histories.map(formatPrescriptionHistory),
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  },

  /**
   * Update prescription history
   */
  async updatePrescriptionHistory(id: string, data: Partial<CreatePrescriptionHistoryRequest>) {
    return prisma.prescriptionHistory.update({
      where: { id },
      data: {
        patientName: data.patientName,
        doctorName: data.doctorName,
        prescriptionDate: data.prescriptionDate ? new Date(data.prescriptionDate) : undefined,
        medications: data.medications,
        notes: data.notes,
      },
    });
  },

  /**
   * Delete prescription history
   */
  async deletePrescriptionHistory(id: string) {
    return prisma.prescriptionHistory.delete({
      where: { id },
    });
  },

  /**
   * Get prescription statistics
   */
  async getPrescriptionStatistics() {
    const total = await prisma.prescriptionHistory.count();
    const thisMonth = await prisma.prescriptionHistory.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const avgAmount = await prisma.prescriptionHistory.aggregate({
      _avg: {
        totalAmount: true,
      },
    });

    return {
      totalPrescriptions: total,
      thisMonthPrescriptions: thisMonth,
      averageTransactionAmount: avgAmount._avg.totalAmount || 0,
    };
  },
};
