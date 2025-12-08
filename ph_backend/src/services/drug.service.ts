import prisma from '../config/database';
import { CreateDrugRequest } from '../types';
import { generateSKU, calculatePagination } from '../utils/helpers';
import { ERROR_MESSAGES } from '../constants';

export class DrugService {
  /**
   * Get all drugs with pagination
   */
  async getAllDrugs(page: number = 1, limit: number = 10, search?: string) {
    const where = search
      ? {
          OR: [
            { brandName: { contains: search, mode: 'insensitive' as const } },
            { genericName: { contains: search, mode: 'insensitive' as const } },
            { sku: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const total = await prisma.drug.count({ where });
    const pagination = calculatePagination(page, limit, total);

    const drugs = await prisma.drug.findMany({
      where,
      skip: pagination.offset,
      take: pagination.itemsPerPage,
      orderBy: { createdAt: 'desc' },
      include: {
        inventoryBatches: {
          select: {
            id: true,
            quantity: true,
            sellPrice: true,
            expiryDate: true,
          },
        },
      },
    });

    return { drugs, pagination };
  }

  /**
   * Get drug by ID
   */
  async getDrugById(id: string) {
    const drug = await prisma.drug.findUnique({
      where: { id },
      include: {
        inventoryBatches: {
          include: {
            supplier: true,
          },
          orderBy: { expiryDate: 'asc' },
        },
      },
    });

    if (!drug) {
      throw new Error(ERROR_MESSAGES.DRUG_NOT_FOUND);
    }

    return drug;
  }

  /**
   * Create new drug
   */
  async createDrug(data: CreateDrugRequest) {
    const sku = generateSKU(data.category, data.brandName);

    const drug = await prisma.drug.create({
      data: {
        brandName: data.brandName,
        genericName: data.genericName,
        category: data.category,
        manufacturer: data.manufacturer,
        requiresPrescription: data.requiresPrescription || false,
        reorderLevel: data.reorderLevel || 10,
        sku,
      },
    });

    return drug;
  }

  /**
   * Update drug
   */
  async updateDrug(id: string, data: Partial<CreateDrugRequest>) {
    const drug = await prisma.drug.update({
      where: { id },
      data,
    });

    return drug;
  }

  /**
   * Delete drug
   */
  async deleteDrug(id: string) {
    await prisma.drug.delete({
      where: { id },
    });
  }

  /**
   * Get low stock drugs
   */
  async getLowStockDrugs() {
    const drugs = await prisma.drug.findMany({
      include: {
        inventoryBatches: true,
      },
    });

    const lowStockDrugs = drugs.filter((drug) => {
      const totalStock = drug.inventoryBatches.reduce((sum, batch) => sum + batch.quantity, 0);
      return totalStock <= drug.reorderLevel;
    });

    return lowStockDrugs;
  }

  /**
   * Get drug categories
   */
  async getCategories() {
    const categories = await prisma.drug.groupBy({
      by: ['category'],
      _count: true,
    });

    return categories;
  }
}

export const drugService = new DrugService();
