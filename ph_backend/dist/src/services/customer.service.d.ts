import { CreateCustomerRequest } from '../types';
export declare class CustomerService {
    /**
     * Get all customers with pagination
     */
    getAllCustomers(page?: number, limit?: number, search?: string): Promise<{
        customers: {
            id: string;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            address: string | null;
            phone: string | null;
        }[];
        pagination: {
            currentPage: number;
            itemsPerPage: number;
            totalPages: number;
            totalItems: number;
            offset: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }>;
    /**
     * Get customer by ID
     */
    getCustomerById(id: string): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
    }>;
    /**
     * Create new customer
     */
    createCustomer(data: CreateCustomerRequest): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
    }>;
    /**
     * Update customer
     */
    updateCustomer(id: string, data: Partial<CreateCustomerRequest>): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
    }>;
    /**
     * Delete customer
     */
    deleteCustomer(id: string): Promise<void>;
    /**
     * Search customers
     */
    searchCustomers(query: string): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        address: string | null;
        phone: string | null;
    }[]>;
}
export declare const customerService: CustomerService;
//# sourceMappingURL=customer.service.d.ts.map