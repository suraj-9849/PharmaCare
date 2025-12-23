PharmaCare - Complete Setup Guide

PROJECT OVERVIEW

PharmaCare is a monorepo containing:
- Frontend: Next.js 15+ with TypeScript
- Backend: Node.js/Express with TypeScript and Prisma ORM  
- AI Assistant: FastAPI with Python 3.11+
- Monitoring: Prometheus, Grafana, Loki, Promtail

PREREQUISITES

System Requirements
- Node.js 20+
- pnpm 9+
- Python 3.11+
- Docker and Docker Compose (for monitoring and database)
- Git

Installation

1. Install Node.js
   - Download from https://nodejs.org/ (version 20+)
   - Verify: node --version

2. Install pnpm
   npm install -g pnpm@9
   pnpm --version

3. Install Python
   - Download from https://www.python.org/ (version 3.11+)
   - Verify: python --version

4. Install Docker
   - Download from https://www.docker.com/
   - Verify: docker --version && docker compose version

SETUP STEPS

1. Clone Repository and Install Dependencies

   cd PharmaCare
   pnpm install

   This installs dependencies for all workspaces (backend, frontend, ai_assistant)

2. Environment Configuration

   Copy environment files and paste the required credentials
   cp .env.docker .env
   cp ph_backend/.env.example ph_backend/.env
   cp ph_frontend/.env.example ph_frontend/.env
   cp ai_assistant/.env.example ai_assistant/.env
   create the firebase-service-account.json and paste in ph_backend  

3. Setup AI Assistant

   pnpm ai:setup

   This command:
   - Creates Python virtual environment (.venv)
   - Installs uv package manager
   - Installs all dependencies including dev tools
   - Installs uvicorn for running the server

4. Validate Project Setup

   node scripts/validate.js

   Checks:
   - Project structure
   - Configuration files
   - Environment setup
   - Dependency integrity
   - Code quality checks

RUNNING THE PROJECT

Development Mode - All Services

To run frontend and backend together (AI assistant must be started separately):

   pnpm dev

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

Development Mode - Individual Services

Frontend Only
   cd ph_frontend
   pnpm dev
   Or: pnpm frontend:dev

Backend Only
   cd ph_backend
   pnpm dev
   Or: pnpm backend:dev

AI Assistant Only
   pnpm ai:dev

   Starts on: http://localhost:8000
   API docs available at: http://localhost:8000/docs

Monitoring Stack

   docker compose -f docker-compose.monitoring.yaml up

   Services:
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000 (user: admin, pass: admin)
   - Loki: http://localhost:3100

Full Stack with Docker

   docker compose up -d

   Starts all services including database and monitoring

RUNNING TESTS

All Tests
   ./scripts/test.sh all

Backend Tests Only
   ./scripts/test.sh backend
   Or: cd ph_backend && pnpm test

Frontend Tests Only
   ./scripts/test.sh frontend
   Or: cd ph_frontend && pnpm test

Python Tests Only
   ./scripts/test.sh python
   Or: cd ai_assistant && .venv/bin/pytest -v

Code Quality Checks
   ./scripts/test.sh lint
   Or: pnpm lint

Build Tests
   ./scripts/test.sh build

CODE FORMATTING AND LINTING

Format All Code
   pnpm format

   Formats:
   - Backend (Prettier)
   - Frontend (Prettier)
   - Python (Black)

Format Backend Only
   pnpm backend:format

Format Frontend Only
   pnpm frontend:format

Format Python Only
   pnpm ai:format

Lint All Code
   pnpm lint

   Checks:
   - Backend (ESLint)
   - Frontend (ESLint)
   - Python (Flake8)

Fix Linting Issues
   pnpm lint:fix

Type Checking
   pnpm type-check

   Runs TypeScript and mypy checks
