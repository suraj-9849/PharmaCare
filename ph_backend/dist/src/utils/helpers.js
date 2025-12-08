"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEndOfToday = exports.getStartOfToday = exports.isExpiringSoon = exports.isExpired = exports.formatCurrency = exports.calculatePagination = exports.generateSKU = exports.verifyToken = exports.generateToken = exports.comparePassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const SALT_ROUNDS = 10;
/**
 * Hash password
 */
const hashPassword = async (password) => {
    return await bcrypt_1.default.hash(password, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
    return await bcrypt_1.default.compare(password, hash);
};
exports.comparePassword = comparePassword;
/**
 * Generate JWT token
 */
const generateToken = (payload) => {
    // JWT library has type issues with secret and options - using any is necessary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const secret = env_1.default.JWT_SECRET;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options = {
        expiresIn: env_1.default.JWT_EXPIRES_IN,
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateToken = generateToken;
/**
 * Verify JWT token
 */
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
    }
    catch {
        return null;
    }
};
exports.verifyToken = verifyToken;
/**
 * Generate SKU
 */
const generateSKU = (category, brandName) => {
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    const brandPrefix = brandName.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${categoryPrefix}-${brandPrefix}-${random}`;
};
exports.generateSKU = generateSKU;
/**
 * Calculate pagination
 */
const calculatePagination = (page, limit, total) => {
    const currentPage = parseInt(String(page)) || 1;
    const itemsPerPage = parseInt(String(limit)) || 10;
    const totalPages = Math.ceil(total / itemsPerPage);
    const offset = (currentPage - 1) * itemsPerPage;
    return {
        currentPage,
        itemsPerPage,
        totalPages,
        totalItems: total,
        offset,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
    };
};
exports.calculatePagination = calculatePagination;
/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
/**
 * Check if date is expired
 */
const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
};
exports.isExpired = isExpired;
/**
 * Check if expiring soon (within specified days)
 */
const isExpiringSoon = (expiryDate, days = 30) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= days;
};
exports.isExpiringSoon = isExpiringSoon;
/**
 * Get start of today
 */
const getStartOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};
exports.getStartOfToday = getStartOfToday;
/**
 * Get end of today
 */
const getEndOfToday = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
};
exports.getEndOfToday = getEndOfToday;
//# sourceMappingURL=helpers.js.map