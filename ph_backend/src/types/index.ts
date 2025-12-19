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
  shelfLocationId?: string;
  queuePosition?: number;
  dateAdded: Date;
}

export interface CreateBatchRequest {
  drugId: string;
  batchNumber: string;
  quantity: number;
  purchasePrice: number;
  sellPrice: number;
  expiryDate: string;
  supplierId?: string | null;
  location?: string | null;
  shelfLocationId?: string | null;
  slotPosition?: number | null;
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
  customerId?: string; // Optional - for customer tracking (null = walk-in customer)
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

export interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user?: UserResponse;
}

// ==================== SMART SHELF TYPES ====================

export type ShelfStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type ExpiryAction = 'RETURN_TO_VENDOR' | 'DISCOUNT' | 'DISPOSE';

export interface ShelfLocation {
  id: string;
  shelfCode: string;
  shelfName: string;
  row?: string;
  column?: string;
  zone?: string;
  capacity: number;
  status: ShelfStatus;
  qrCode?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShelfLocationRequest {
  shelfCode: string;
  shelfName: string;
  row?: string;
  column?: string;
  zone?: string;
  capacity?: number;
  status?: ShelfStatus;
  qrCode?: string;
  notes?: string;
}

export interface UpdateShelfLocationRequest {
  shelfName?: string;
  row?: string;
  column?: string;
  zone?: string;
  capacity?: number;
  status?: ShelfStatus;
  qrCode?: string;
  notes?: string;
}

export interface IncorrectPickAlert {
  id: string;
  shelfLocationId: string;
  batchIdPicked: string;
  batchIdExpected: string;
  pickedBy?: string;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface ExpiryActionRecord {
  id: string;
  batchId: string;
  action: ExpiryAction;
  performedBy?: string;
  quantity: number;
  reason?: string;
  vendorReturn: boolean;
  discountAmount?: number;
  notes?: string;
  createdAt: Date;
}

export interface CreateExpiryActionRequest {
  batchId: string;
  action: ExpiryAction;
  quantity: number;
  reason?: string;
  vendorReturn?: boolean;
  discountAmount?: number;
  notes?: string;
}

// Smart Shelf with batches (enriched response)
export interface ShelfLocationWithBatches extends ShelfLocation {
  batches: Array<
    InventoryBatch & {
      drug: Drug;
      supplier?: Supplier;
      daysUntilExpiry: number;
      isExpired: boolean;
      isExpiringSoon: boolean;
    }
  >;
  currentStock: number;
  utilizationPercentage: number;
}

// Virtual Queue Item
export interface QueuedBatch {
  batch: InventoryBatch & { drug: Drug };
  position: number;
  isAtFront: boolean;
}

// Batch pick validation response
export interface PickValidationResult {
  isValid: boolean;
  expectedBatch?: InventoryBatch & { drug: Drug };
  pickedBatch?: InventoryBatch & { drug: Drug };
  message: string;
  alert?: IncorrectPickAlert;
}
