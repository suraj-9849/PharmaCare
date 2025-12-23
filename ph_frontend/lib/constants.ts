// Re-export all constants from the constants directory
export * from './constants/index';

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CREDIT', label: 'Credit' },
] as const;

// Sale statuses
export const SALE_STATUSES = [
  { value: 'COMPLETED', label: 'Completed', color: 'green' },
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
  { value: 'REFUNDED', label: 'Refunded', color: 'blue' },
] as const;

// User roles
export const USER_ROLES = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'PHARMACIST', label: 'Pharmacist' },
  { value: 'CASHIER', label: 'Cashier' },
] as const;

// Drug categories
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
