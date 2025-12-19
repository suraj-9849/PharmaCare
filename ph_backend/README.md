# DrugDesk - Backend API

Professional Pharmacy Management System API built with Express.js, TypeScript, and Prisma 7.

## Features

- 🔐 JWT-based authentication
- 📦 Drug inventory management
- 💰 Sales tracking and reporting
- 🏢 Supplier management
- 👥 Customer management
- ⏰ Expiry alerts
- 📊 Dashboard analytics
- 📈 Stock monitoring

## Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL 14+
- Docker (optional)

## Installation

### Local Development

1. **Clone and setup**
```bash
cd ph_backend
pnpm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Database Setup**
```bash
pnpm setup  # Generates Prisma client, pushes schema, and seeds data
```

4. **Start Development Server**
```bash
pnpm dev
```

Server will start on `http://localhost:5000`

### Docker

```bash
cd ..
docker-compose up -d backend
```

## Available Scripts

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm build           # Build TypeScript
pnpm start           # Start production server

# Database
pnpm prisma:generate # Generate Prisma client
pnpm prisma:push     # Sync schema with database
pnpm prisma:migrate  # Create and apply migrations
pnpm prisma:studio   # Open Prisma Studio
pnpm seed            # Seed database with sample data

# Code Quality
pnpm lint            # Run ESLint
pnpm lint:fix        # Fix ESLint issues
pnpm format          # Format code with Prettier
pnpm format:check    # Check formatting

# Setup
pnpm setup           # Complete setup (generate, push, seed)
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - Login with email and password

### Drug Endpoints

- `GET /api/drugs` - Get all drugs (paginated)
- `POST /api/drugs` - Create new drug
- `GET /api/drugs/:id` - Get drug by ID
- `PUT /api/drugs/:id` - Update drug
- `DELETE /api/drugs/:id` - Delete drug

### Inventory Endpoints

- `GET /api/inventory` - Get all batches (paginated)
- `POST /api/inventory` - Create new batch
- `GET /api/inventory/:id` - Get batch by ID
- `PUT /api/inventory/:id` - Update batch
- `DELETE /api/inventory/:id` - Delete batch

### Sales Endpoints

- `GET /api/sales` - Get all sales (paginated)
- `POST /api/sales` - Create new sale
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales/:id/cancel` - Cancel sale

### Supplier Endpoints

- `GET /api/suppliers` - Get all suppliers (paginated)
- `POST /api/suppliers` - Create new supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Customer Endpoints

- `GET /api/customers` - Get all customers (paginated)
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Dashboard Endpoints

- `GET /api/dashboard` - Get dashboard statistics
- `GET /api/dashboard/chart` - Get sales chart data
- `GET /api/dashboard/top-selling` - Get top-selling drugs

## Database Schema

Key models:
- **User** - System users with roles
- **Drug** - Pharmaceutical products
- **InventoryBatch** - Stock batches with expiry dates
- **Supplier** - Drug suppliers
- **Customer** - Customer records
- **Sale** - Sales transactions
- **SaleItem** - Individual items in sales

## Default Credentials

```
Email: ph@gmail.com
Password: ph@123
Role: ADMIN
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/pharmacy
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify credentials match your database

### Prisma Generate Errors
- Delete `generated` folder
- Run `pnpm prisma:generate` again

### Port Already in Use
- Change PORT in .env
- Or kill existing process on port 5000

## Architecture

```
src/
├── config/        # Configuration files
├── middleware/    # Express middleware
├── routes/        # API routes
├── services/      # Business logic
├── types/         # TypeScript types
├── utils/         # Helper functions
├── constants/     # Constants
└── index.ts       # Application entry point
```

## Deployment

### Using Docker

```bash
# Build image
docker build -t DrugDesk-api .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  DrugDesk-api
```

### Using docker-compose

```bash
docker-compose up -d backend
```

## Contributing

1. Follow the code style in `.eslintrc.json`
2. Format code with Prettier
3. Ensure all types are properly defined
4. Test API endpoints before committing

## License

ISC
