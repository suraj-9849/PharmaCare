// User types
export type UserRole = 'ADMIN' | 'PHARMACIST' | 'CASHIER';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  name?: string; // Added for display purposes
  createdAt: string;
  updatedAt?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Drug types
export interface Drug {
  id: string;
  brandName: string;
  genericName: string;
  category: string;
  manufacturer: string;
  requiresPrescription: boolean;
  reorderLevel: number;
  sku: string;
  createdAt: string;
  updatedAt: string;
  inventoryBatches?: InventoryBatch[];
  // Aliases for convenience
  name?: string; // Alias for brandName
  dosageForm?: string;
  strength?: string;
  description?: string;
  supplierId?: string;
}

export interface CreateDrugRequest {
  brandName: string;
  genericName: string;
  category: string;
  manufacturer: string;
  requiresPrescription?: boolean;
  reorderLevel?: number;
}

// Inventory types
export interface InventoryBatch {
  id: string;
  drugId: string;
  batchNumber: string;
  quantity: number;
  purchasePrice: number;
  sellPrice: number;
  sellingPrice?: number; // Alias for sellPrice
  expiryDate: string;
  supplierId: string;
  location?: string;
  dateAdded: string;
  manufacturingDate?: string;
  createdAt?: string;
  updatedAt?: string;
  drug?: Drug;
  supplier?: Supplier;
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

// Supplier types
export interface Supplier {
  id: string;
  supplierName: string;
  contactNumber: string;
  email: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  // Aliases
  name?: string; // Alias for supplierName
  contactPerson?: string;
  phone?: string; // Alias for contactNumber
  isActive?: boolean;
}

export interface CreateSupplierRequest {
  supplierName: string;
  contactNumber: string;
  email: string;
  address: string;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

// Sale types
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'CREDIT';
export type SaleStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'REFUNDED';

export interface Sale {
  id: string;
  userId: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeGiven?: number;
  saleDate: string;
  status: SaleStatus;
  createdAt?: string;
  updatedAt?: string;
  // Extended fields
  invoiceNumber?: string;
  customerId?: string;
  discount?: number;
  subtotal?: number;
  notes?: string;
  user?: { id: string; username: string };
  customer?: Customer;
  items?: SaleItem[];
  saleItems?: SaleItem[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  drugId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  price?: number; // Alias for unitPrice
  subtotal: number;
  drug?: Drug;
  batch?: InventoryBatch;
}

export interface CreateSaleRequest {
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  customerId?: string;
  discount?: number;
  notes?: string;
  items: {
    drugId?: string;
    batchId: string;
    quantity: number;
    price?: number;
  }[];
}

// Stock Alert types
export type AlertType = 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';

export interface StockAlert {
  id: string;
  drugId: string;
  alertType: AlertType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Dashboard types
export interface DashboardStats {
  todaySales?: number;
  todaySalesCount?: number;
  todayRevenue?: number;
  totalDrugs?: number;
  totalProducts?: number;
  totalSales?: number;
  totalSalesAmount?: number;
  totalRevenue?: number;
  lowStockCount?: number;
  expiringCount?: number;
  expiredCount?: number;
  totalSuppliers?: number;
  totalCustomers?: number;
  totalInventoryValue?: number;
}

export interface RevenueByCategory {
  name: string;
  value: number;
  percentage?: number;
}

export interface PaymentMethodData {
  name: string;
  value: number;
  percentage?: number;
  [key: string]: unknown;
}

export interface InventoryByCategory {
  name: string;
  stock: number;
  reorderLevel: number;
  percentage?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentSales?: Sale[];
  expiringBatches?: InventoryBatch[];
  lowStockBatches?: InventoryBatch[];
  topSellingDrugs?: TopSellingDrug[];
  chartData?: ChartData[];
  revenueByCategory?: RevenueByCategory[];
  paymentMethods?: PaymentMethodData[];
  inventoryByCategory?: InventoryByCategory[];
}

export interface ChartData {
  date: string;
  sales: number;
  revenue: number;
}

export interface TopSellingDrug {
  id?: string;
  drugId?: string;
  name?: string;
  brandName?: string;
  genericName?: string;
  category?: string;
  totalQuantity?: number;
  totalSold?: number;
  totalRevenue?: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination?: {
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Stock Summary
export interface StockSummary {
  drugId: string;
  brandName: string;
  genericName: string;
  totalStock: number;
  reorderLevel: number;
  isLowStock: boolean;
  expiringCount: number;
  expiredCount: number;
}
