export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export declare const ERROR_MESSAGES: {
    readonly INVALID_CREDENTIALS: "Invalid email or password";
    readonly USER_NOT_FOUND: "User not found";
    readonly UNAUTHORIZED: "Unauthorized access";
    readonly FORBIDDEN: "You do not have permission to access this resource";
    readonly TOKEN_EXPIRED: "Token has expired";
    readonly TOKEN_INVALID: "Invalid token";
    readonly INTERNAL_ERROR: "Internal server error";
    readonly VALIDATION_ERROR: "Validation error";
    readonly DRUG_NOT_FOUND: "Drug not found";
    readonly BATCH_NOT_FOUND: "Batch not found";
    readonly SUPPLIER_NOT_FOUND: "Supplier not found";
    readonly CUSTOMER_NOT_FOUND: "Customer not found";
    readonly INSUFFICIENT_STOCK: "Insufficient stock";
    readonly SALE_NOT_FOUND: "Sale not found";
    readonly EMAIL_EXISTS: "Email already exists";
    readonly USERNAME_EXISTS: "Username already exists";
};
export declare const SUCCESS_MESSAGES: {
    readonly LOGIN_SUCCESS: "Login successful";
    readonly LOGOUT_SUCCESS: "Logout successful";
    readonly USER_CREATED: "User created successfully";
    readonly DRUG_CREATED: "Drug created successfully";
    readonly DRUG_UPDATED: "Drug updated successfully";
    readonly DRUG_DELETED: "Drug deleted successfully";
    readonly SUPPLIER_CREATED: "Supplier created successfully";
    readonly SUPPLIER_UPDATED: "Supplier updated successfully";
    readonly SUPPLIER_DELETED: "Supplier deleted successfully";
    readonly CUSTOMER_CREATED: "Customer created successfully";
    readonly CUSTOMER_UPDATED: "Customer updated successfully";
    readonly CUSTOMER_DELETED: "Customer deleted successfully";
    readonly SALE_COMPLETED: "Sale completed successfully";
    readonly SALE_CANCELLED: "Sale cancelled successfully";
    readonly BATCH_ADDED: "Batch added successfully";
    readonly BATCH_UPDATED: "Batch updated successfully";
    readonly FETCH_SUCCESS: "Data fetched successfully";
};
export declare const USER_ROLES: {
    readonly ADMIN: "ADMIN";
    readonly PHARMACIST: "PHARMACIST";
    readonly CASHIER: "CASHIER";
};
export declare const PAYMENT_METHODS: {
    readonly CASH: "CASH";
    readonly CARD: "CARD";
    readonly UPI: "UPI";
    readonly CREDIT: "CREDIT";
};
export declare const SALE_STATUS: {
    readonly COMPLETED: "COMPLETED";
    readonly PENDING: "PENDING";
    readonly CANCELLED: "CANCELLED";
    readonly REFUNDED: "REFUNDED";
};
export declare const ALERT_TYPES: {
    readonly LOW_STOCK: "LOW_STOCK";
    readonly EXPIRING_SOON: "EXPIRING_SOON";
    readonly EXPIRED: "EXPIRED";
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 10;
    readonly MAX_LIMIT: 100;
};
export declare const DRUG_CATEGORIES: readonly ["Analgesics", "Antibiotics", "Antivirals", "Antifungals", "Cardiovascular", "Diabetes", "Gastrointestinal", "Respiratory", "Dermatology", "Vitamins & Supplements", "OTC", "Other"];
//# sourceMappingURL=index.d.ts.map