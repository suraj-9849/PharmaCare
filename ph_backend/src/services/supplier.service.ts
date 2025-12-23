import prisma from '../config/database';
import { CreateSupplierRequest } from '../types';
import { calculatePagination } from '../utils/helpers';
import { ERROR_MESSAGES } from '../constants';

export class SupplierService {
  /**
   * Get all suppliers with pagination
   */
  async getAllSuppliers(page: number = 1, limit: number = 10, search?: string) {
    const where = search
      ? {
          OR: [
            { supplierName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const total = await prisma.supplier.count({ where });
    const pagination = calculatePagination(page, limit, total);

    const suppliers = await prisma.supplier.findMany({
      where,
      skip: pagination.offset,
      take: pagination.itemsPerPage,
      orderBy: { createdAt: 'desc' },
    });

    return { suppliers, pagination };
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        inventoryBatches: {
          include: {
            drug: true,
          },
          orderBy: { dateAdded: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) {
      throw new Error(ERROR_MESSAGES.SUPPLIER_NOT_FOUND);
    }

    return supplier;
  }

  /**
   * Create new supplier
   */
  async createSupplier(data: CreateSupplierRequest) {
    const supplier = await prisma.supplier.create({
      data: {
        supplierName: data.supplierName,
        contactNumber: data.contactNumber,
        email: data.email,
        address: data.address,
      },
    });

    return supplier;
  }

  /**
   * Update supplier
   */
  async updateSupplier(id: string, data: Partial<CreateSupplierRequest>) {
    const supplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    return supplier;
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(id: string) {
    await prisma.supplier.delete({
      where: { id },
    });
  }

  /**
   * Get all suppliers (for dropdown)
   */
  async getAllSuppliersSimple() {
    return prisma.supplier.findMany({
      select: {
        id: true,
        supplierName: true,
      },
      orderBy: { supplierName: 'asc' },
    });
  }
}

export const supplierService = new SupplierService();
