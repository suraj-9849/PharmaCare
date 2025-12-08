/**
 * Frontend Constants
 * All hardcoded values and configuration constants
 */

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const API_TIMEOUT = 30000; // 30 seconds
export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'user';

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  DRUGS: '/dashboard/drugs',
  INVENTORY: '/dashboard/inventory',
  SALES: '/dashboard/sales',
  SUPPLIERS: '/dashboard/suppliers',
  CUSTOMERS: '/dashboard/customers',
  EXPIRY: '/dashboard/expiry',
  LOW_STOCK: '/dashboard/low-stock',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },
  DRUGS: '/drugs',
  INVENTORY: '/inventory',
  SALES: '/sales',
  SUPPLIERS: '/suppliers',
  CUSTOMERS: '/customers',
  DASHBOARD: '/dashboard',
} as const;

// Drug Categories
export const DRUG_CATEGORIES = [
  'Antibiotic',
  'Analgesic',
  'Antacid',
  'Antihistamine',
  'Antihypertensive',
  'Antidiabetic',
  'Antipyretic',
  'Antiseptic',
  'Vitamin',
  'Supplement',
  'Other',
] as const;

// Payment Methods
export const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'CREDIT'] as const;

// Sale Status
export const SALE_STATUS = {
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  PHARMACIST: 'PHARMACIST',
  CASHIER: 'CASHIER',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Date Ranges
export const DATE_RANGES = {
  EXPIRY_ALERT_DAYS: 30,
  EXPIRY_CRITICAL_DAYS: 7,
  LOW_STOCK_THRESHOLD: 1.5,
  LOW_STOCK_CRITICAL: 0.25,
} as const;

// Messages
export const MESSAGES = {
  SUCCESS: {
    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    LOGIN: 'Logged in successfully',
    LOGOUT: 'Logged out successfully',
  },
  ERROR: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Invalid email address',
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Unauthorized access',
    NOT_FOUND: 'Resource not found',
    SERVER_ERROR: 'Server error occurred',
    NETWORK_ERROR: 'Network error occurred',
    INSUFFICIENT_STOCK: 'Insufficient stock available',
    INVALID_QUANTITY: 'Invalid quantity',
  },
  INFO: {
    LOADING: 'Loading...',
    NO_DATA: 'No data available',
    CONFIRMING: 'Please wait...',
  },
} as const;

// Default Form Values
export const DEFAULT_FORM_VALUES = {
  DRUG: {
    brandName: '',
    genericName: '',
    category: '',
    manufacturer: '',
    requiresPrescription: false,
    reorderLevel: 50,
  },
  BATCH: {
    drugId: '',
    batchNumber: '',
    quantity: 0,
    purchasePrice: 0,
    sellPrice: 0,
    expiryDate: '',
    supplierId: '',
    location: '',
  },
  SUPPLIER: {
    supplierName: '',
    contactNumber: '',
    email: '',
    address: '',
  },
  CUSTOMER: {
    name: '',
    email: '',
    phone: '',
    address: '',
  },
  SALE: {
    paymentMethod: 'CASH',
    cashReceived: 0,
  },
} as const;

// UI Constants
export const UI = {
  SIDEBAR_WIDTH_COLLAPSED: 64, // pixels
  SIDEBAR_WIDTH_EXPANDED: 256, // pixels
  HEADER_HEIGHT: 64, // pixels
  SCROLL_AREA_HEIGHT: 600, // pixels
} as const;

// Colors & Styles
export const STATUS_COLORS = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
  EXPIRED: 'bg-red-100 text-red-700',
  EXPIRING_SOON: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
  LOW: 'bg-orange-100 text-orange-700',
  WARNING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
} as const;

// Validation Rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MIN_REORDER_LEVEL: 1,
  MAX_REORDER_LEVEL: 10000,
} as const;

// Sort Options
export const SORT_OPTIONS = {
  ASCENDING: 'asc',
  DESCENDING: 'desc',
} as const;

// Dialog Types
export const DIALOG_TYPES = {
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  VIEW: 'view',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  THEME: 'theme',
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_DASHBOARD_CHARTS: true,
  ENABLE_EXPORT: true,
  ENABLE_BULK_OPERATIONS: true,
  ENABLE_AUDIT_LOG: true,
} as const;
