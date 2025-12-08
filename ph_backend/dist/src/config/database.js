"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_pg_1 = require("@prisma/adapter-pg");
const env_1 = __importDefault(require("./env"));
const client_1 = require("@prisma/client");
const adapter = new adapter_pg_1.PrismaPg({ connectionString: env_1.default.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
exports.default = prisma;
//# sourceMappingURL=database.js.map