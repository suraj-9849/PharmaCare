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
pnpm setup  
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

## Deployment

### Using Docker

```bash
# Build image
docker build -t pharmacare-api .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  pharmacare-api
```

### Using docker-compose

```bash
docker-compose up -d backend
```