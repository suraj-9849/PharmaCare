import * as runtime from "@prisma/client/runtime/client";
import * as $Class from "./internal/class";
import * as Prisma from "./internal/prismaNamespace";
export * as $Enums from './enums';
export * from "./enums";
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export declare const PrismaClient: $Class.PrismaClientConstructor;
export type PrismaClient<LogOpts extends Prisma.LogLevel = never, OmitOpts extends Prisma.PrismaClientOptions["omit"] = Prisma.PrismaClientOptions["omit"], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = $Class.PrismaClient<LogOpts, OmitOpts, ExtArgs>;
export { Prisma };
/**
 * Model User
 *
 */
export type User = Prisma.UserModel;
/**
 * Model Drug
 *
 */
export type Drug = Prisma.DrugModel;
/**
 * Model Supplier
 *
 */
export type Supplier = Prisma.SupplierModel;
/**
 * Model InventoryBatch
 *
 */
export type InventoryBatch = Prisma.InventoryBatchModel;
/**
 * Model Sale
 *
 */
export type Sale = Prisma.SaleModel;
/**
 * Model SaleItem
 *
 */
export type SaleItem = Prisma.SaleItemModel;
/**
 * Model Customer
 *
 */
export type Customer = Prisma.CustomerModel;
/**
 * Model StockAlert
 *
 */
export type StockAlert = Prisma.StockAlertModel;
/**
 * Model SystemSetting
 *
 */
export type SystemSetting = Prisma.SystemSettingModel;
//# sourceMappingURL=client.d.ts.map