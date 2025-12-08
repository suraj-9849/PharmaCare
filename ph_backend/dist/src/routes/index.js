"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const drug_routes_1 = __importDefault(require("./drug.routes"));
const inventory_routes_1 = __importDefault(require("./inventory.routes"));
const sale_routes_1 = __importDefault(require("./sale.routes"));
const supplier_routes_1 = __importDefault(require("./supplier.routes"));
const customer_routes_1 = __importDefault(require("./customer.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const router = (0, express_1.Router)();
// API Routes
router.use('/auth', auth_routes_1.default);
router.use('/drugs', drug_routes_1.default);
router.use('/inventory', inventory_routes_1.default);
router.use('/sales', sale_routes_1.default);
router.use('/suppliers', supplier_routes_1.default);
router.use('/customers', customer_routes_1.default);
router.use('/dashboard', dashboard_routes_1.default);
// Health check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = router;
//# sourceMappingURL=index.js.map