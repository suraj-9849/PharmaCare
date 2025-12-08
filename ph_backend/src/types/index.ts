// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'ADMIN' | 'PHARMACIST' | 'CASHIER';

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

// Drug Types
export interface Drug {
  id: string;
  brandName: string;
  genericName: string;
  category: string;
  manufacturer: string;
  requiresPrescription: boolean;
  reorderLevel: number;
  sku: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDrugRequest {
  brandName: string;
  genericName: string;
  category: string;
  manufacturer: string;
  requiresPrescription?: boolean;
  reorderLevel?: number;
}

// Supplier Types
export interface Supplier {
  id: string;
  supplierName: string;
  contactNumber: string;
  email: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupplierRequest {
  supplierName: string;
  contactNumber: string;
  email: string;
  address: string;
}

// Inventory Types
export interface InventoryBatch {
  id: string;
  drugId: string;
  batchNumber: string;
  quantity: number;
  purchasePrice: number;
  sellPrice: number;
  expiryDate: Date;
  supplierId: string;
  location?: string;
  dateAdded: Date;
}

export interface CreateBatchRequest {
  drugId: string;
  batchNumber: string;
  quantity: number;
  purchasePrice: number;
  sellPrice: number;
  expiryDate: string;
  supplierId: string;
  location?: string;
}

// Sale Types
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'CREDIT';
export type SaleStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'REFUNDED';

export interface Sale {
  id: string;
  userId: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeGiven?: number;
  saleDate: Date;
  status: SaleStatus;
}

export interface SaleItem {
  id: string;
  saleId: string;
  drugId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CreateSaleRequest {
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeGiven?: number;
  transactionId?: string; // Razorpay payment ID for UPI/Card payments
  items: {
    drugId: string;
    batchId: string;
    quantity: number;
    unitPrice?: number;
  }[];
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  expiringCount: number;
  todaySales: number;
  todayRevenue: number;
  recentSales: Sale[];
  stockAlerts: StockAlert[];
}

// Stock Alert Types
export type AlertType = 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';

export interface StockAlert {
  id: string;
  drugId: string;
  alertType: AlertType;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Request with user
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: UserResponse;
}
