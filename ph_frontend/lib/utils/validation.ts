/**
 * Validation Utilities
 */

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Validate required field
 */
export const isRequired = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'number') {
    return value > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Validate minimum length
 */
export const isMinLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

/**
 * Validate maximum length
 */
export const isMaxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

/**
 * Validate quantity
 */
export const isValidQuantity = (quantity: number): boolean => {
  return quantity > 0 && Number.isInteger(quantity);
};

/**
 * Validate price
 */
export const isValidPrice = (price: number): boolean => {
  return price >= 0 && !isNaN(price);
};

/**
 * Validate date
 */
export const isValidDate = (date: string | Date): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Validate future date
 */
export const isFutureDate = (date: string | Date): boolean => {
  return new Date(date) > new Date();
};

/**
 * Validate password
 */
export const isValidPassword = (password: string, minLength = 6): boolean => {
  return password.length >= minLength;
};

/**
 * Validate form field
 */
export interface ValidationRule {
  field: string;
  rules: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => boolean;
  };
}

export const validateField = (
  value: unknown,
  rules: ValidationRule['rules']
): { valid: boolean; error?: string } => {
  if (rules.required && !isRequired(value)) {
    return { valid: false, error: 'This field is required' };
  }

  if (typeof value === 'string') {
    if (rules.min && value.length < rules.min) {
      return { valid: false, error: `Minimum ${rules.min} characters required` };
    }

    if (rules.max && value.length > rules.max) {
      return { valid: false, error: `Maximum ${rules.max} characters allowed` };
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return { valid: false, error: 'Invalid format' };
    }
  }

  if (rules.custom && !rules.custom(value)) {
    return { valid: false, error: 'Invalid input' };
  }

  return { valid: true };
};
