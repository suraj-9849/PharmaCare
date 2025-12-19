// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'You do not have permission to access this resource',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  DRUG_NOT_FOUND: 'Drug not found',
  BATCH_NOT_FOUND: 'Batch not found',
  SUPPLIER_NOT_FOUND: 'Supplier not found',
  CUSTOMER_NOT_FOUND: 'Customer not found',
  INSUFFICIENT_STOCK: 'Insufficient stock',
  SALE_NOT_FOUND: 'Sale not found',
  EMAIL_EXISTS: 'Email already exists',
  USERNAME_EXISTS: 'Username already exists',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  USER_CREATED: 'User created successfully',
  DRUG_CREATED: 'Drug created successfully',
  DRUG_UPDATED: 'Drug updated successfully',
  DRUG_DELETED: 'Drug deleted successfully',
  SUPPLIER_CREATED: 'Supplier created successfully',
  SUPPLIER_UPDATED: 'Supplier updated successfully',
  SUPPLIER_DELETED: 'Supplier deleted successfully',
  CUSTOMER_CREATED: 'Customer created successfully',
  CUSTOMER_UPDATED: 'Customer updated successfully',
  CUSTOMER_DELETED: 'Customer deleted successfully',
  SALE_COMPLETED: 'Sale completed successfully',
  SALE_CANCELLED: 'Sale cancelled successfully',
  BATCH_ADDED: 'Batch added successfully',
  BATCH_UPDATED: 'Batch updated successfully',
  FETCH_SUCCESS: 'Data fetched successfully',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  PHARMACIST: 'PHARMACIST',
  CASHIER: 'CASHIER',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  UPI: 'UPI',
  CREDIT: 'CREDIT',
} as const;

// Sale Status
export const SALE_STATUS = {
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

// Alert Types
export const ALERT_TYPES = {
  LOW_STOCK: 'LOW_STOCK',
  EXPIRING_SOON: 'EXPIRING_SOON',
  EXPIRED: 'EXPIRED',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Drug Categories
export const DRUG_CATEGORIES = [
  'Analgesics',
  'Antibiotics',
  'Antivirals',
  'Antifungals',
  'Cardiovascular',
  'Diabetes',
  'Gastrointestinal',
  'Respiratory',
  'Dermatology',
  'Vitamins & Supplements',
  'OTC',
  'Other',
] as const;
