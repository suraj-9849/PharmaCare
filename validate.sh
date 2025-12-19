#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track if any checks failed
FAILED=0

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        DrugDesk - Pre-Push Validation Script       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section header
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to run a command and track success/failure
run_check() {
    local name=$1
    local command=$2
    local dir=$3
    
    echo -e "\n${YELLOW}Running: $name${NC}"
    
    if [ -n "$dir" ]; then
        cd "$dir" || exit 1
    fi
    
    if eval "$command"; then
        echo -e "${GREEN}✓ $name passed${NC}"
    else
        echo -e "${RED}✗ $name failed${NC}"
        FAILED=1
    fi
    
    if [ -n "$dir" ]; then
        cd - > /dev/null || exit 1
    fi
}

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# =============================================================================
# BACKEND CHECKS
# =============================================================================
print_section "Backend Validation (ph_backend)"

if [ ! -d "ph_backend" ]; then
    echo -e "${RED}✗ Backend directory not found!${NC}"
    FAILED=1
else
    run_check "Backend: Type Check" "pnpm type-check" "ph_backend"
    run_check "Backend: Lint Check" "pnpm lint" "ph_backend"
    run_check "Backend: Format Check" "pnpm format:check" "ph_backend"
fi

# =============================================================================
# FRONTEND CHECKS
# =============================================================================
print_section "Frontend Validation (ph_frontend)"

if [ ! -d "ph_frontend" ]; then
    echo -e "${RED}✗ Frontend directory not found!${NC}"
    FAILED=1
else
    run_check "Frontend: Type Check" "pnpm type-check" "ph_frontend"
    run_check "Frontend: Lint Check" "pnpm lint" "ph_frontend"
    run_check "Frontend: Format Check" "pnpm format:check" "ph_frontend"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Validation Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                 ALL CHECKS PASSED! ✓                  ║${NC}"
    echo -e "${GREEN}║          Your code is ready to be pushed!             ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              SOME CHECKS FAILED! ✗                    ║${NC}"
    echo -e "${RED}║                                                       ║${NC}"
    echo -e "${RED}║  Please fix the errors above before pushing:         ║${NC}"
    echo -e "${RED}║                                                       ║${NC}"
    echo -e "${RED}║  - Run 'pnpm lint:fix' to fix linting issues         ║${NC}"
    echo -e "${RED}║  - Run 'pnpm format' to fix formatting issues        ║${NC}"
    echo -e "${RED}║  - Fix TypeScript errors manually                    ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
fi
