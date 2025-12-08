"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedResponse = exports.errorResponse = exports.successResponse = void 0;
const constants_1 = require("../constants");
/**
 * Send success response
 */
const successResponse = (res, data, message = 'Success', statusCode = constants_1.HTTP_STATUS.OK) => {
    const response = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(response);
};
exports.successResponse = successResponse;
/**
 * Send error response
 */
const errorResponse = (res, message = 'Error', statusCode = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, errors) => {
    const response = {
        success: false,
        message,
        errors,
    };
    return res.status(statusCode).json(response);
};
exports.errorResponse = errorResponse;
/**
 * Send paginated response
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
    const response = {
        success: true,
        message,
        data,
        pagination,
    };
    return res.status(constants_1.HTTP_STATUS.OK).json(response);
};
exports.paginatedResponse = paginatedResponse;
//# sourceMappingURL=response.js.map