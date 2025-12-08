"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerService = exports.CustomerService = void 0;
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../constants");
class CustomerService {
    /**
     * Get all customers with pagination
     */
    async getAllCustomers(page = 1, limit = 10, search) {
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const total = await database_1.default.customer.count({ where });
        const pagination = (0, helpers_1.calculatePagination)(page, limit, total);
        const customers = await database_1.default.customer.findMany({
            where,
            skip: pagination.offset,
            take: pagination.itemsPerPage,
            orderBy: { createdAt: 'desc' },
        });
        return { customers, pagination };
    }
    /**
     * Get customer by ID
     */
    async getCustomerById(id) {
        const customer = await database_1.default.customer.findUnique({
            where: { id },
        });
        if (!customer) {
            throw new Error(constants_1.ERROR_MESSAGES.CUSTOMER_NOT_FOUND);
        }
        return customer;
    }
    /**
     * Create new customer
     */
    async createCustomer(data) {
        const customer = await database_1.default.customer.create({
            data: {
                name: data.name,
                phone: data.phone,
                email: data.email,
                address: data.address,
            },
        });
        return customer;
    }
    /**
     * Update customer
     */
    async updateCustomer(id, data) {
        const customer = await database_1.default.customer.update({
            where: { id },
            data,
        });
        return customer;
    }
    /**
     * Delete customer
     */
    async deleteCustomer(id) {
        await database_1.default.customer.delete({
            where: { id },
        });
    }
    /**
     * Search customers
     */
    async searchCustomers(query) {
        return database_1.default.customer.findMany({
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
exports.CustomerService = CustomerService;
exports.customerService = new CustomerService();
//# sourceMappingURL=customer.service.js.map