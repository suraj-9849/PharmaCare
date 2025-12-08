export declare const UserRole: {
    readonly ADMIN: "ADMIN";
    readonly PHARMACIST: "PHARMACIST";
    readonly CASHIER: "CASHIER";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const PaymentMethod: {
    readonly CASH: "CASH";
    readonly CARD: "CARD";
    readonly UPI: "UPI";
    readonly CREDIT: "CREDIT";
};
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
export declare const SaleStatus: {
    readonly COMPLETED: "COMPLETED";
    readonly PENDING: "PENDING";
    readonly CANCELLED: "CANCELLED";
    readonly REFUNDED: "REFUNDED";
};
export type SaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus];
//# sourceMappingURL=enums.d.ts.map