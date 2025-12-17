import prisma from '../config/database';
import { CreateCustomerRequest } from '../types';
import { calculatePagination } from '../utils/helpers';
import { ERROR_MESSAGES } from '../constants';

export class CustomerService {
  /**
   * Get all customers with pagination
   */
  async getAllCustomers(page: number = 1, limit: number = 10, search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const total = await prisma.customer.count({ where });
    const pagination = calculatePagination(page, limit, total);

    const customers = await prisma.customer.findMany({
      where,
      skip: pagination.offset,
      take: pagination.itemsPerPage,
      orderBy: { createdAt: 'desc' },
    });

    const result = { customers, pagination };

    // Cache the result

    return result;
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string) {
    // Try to get from cache

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new Error(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);
    }

    // Cache the result

    return customer;
  }

  /**
   * Create new customer
   */
  async createCustomer(data: CreateCustomerRequest) {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
      },
    });

    // Invalidate customer caches

    return customer;
  }

  /**
   * Update customer
   */
  async updateCustomer(id: string, data: Partial<CreateCustomerRequest>) {
    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    // Invalidate customer caches

    return customer;
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id: string) {
    await prisma.customer.delete({
      where: { id },
    });
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string) {
    return prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  }
}

export const customerService = new CustomerService();
