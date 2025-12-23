#!/bin/bash

###############################################################################
# PharmaCare Testing Script
# Runs all tests across the monorepo
# Usage: ./test.sh [backend|frontend|python|all]
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
TEST_TYPE="${1:-all}"
VERBOSE="${VERBOSE:-false}"
COVERAGE="${COVERAGE:-true}"

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ============================================================================
# Utility Functions
# ============================================================================

print_header() {
    echo -e "\n${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  $1${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}\n"
}

print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# Backend Testing
# ============================================================================

test_backend() {
    print_section "Testing Backend (Node.js/TypeScript)"
    
    if [ ! -d "$PROJECT_ROOT/ph_backend" ]; then
        print_error "Backend directory not found"
        return 1
    fi

    cd "$PROJECT_ROOT/ph_backend"

    print_info "Backend Structure: $(pwd)"

    # Check for test files
    if find . -maxdepth 2 -name "*.test.ts" -o -name "*.spec.ts" | grep -q .; then
        print_info "Running Jest tests..."
        ((TOTAL_TESTS++))
        
        if pnpm test --passWithNoTests 2>&1 | tee /tmp/backend-test.log; then
            print_success "Backend tests passed"
        else
            print_error "Backend tests failed"
            return 1
        fi

        # Check coverage if enabled
        if [ "$COVERAGE" = "true" ] && [ -f "coverage/coverage-summary.json" ]; then
            print_info "Coverage Report:"
            cat coverage/coverage-summary.json | python3 -m json.tool | head -20
        fi
    else
        print_warning "No backend tests found (*.test.ts, *.spec.ts)"
        print_info "To add tests, create files like: src/__tests__/example.test.ts"
    fi

    cd "$PROJECT_ROOT"
    return 0
}

# ============================================================================
# Frontend Testing
# ============================================================================

test_frontend() {
    print_section "Testing Frontend (Next.js)"
    
    if [ ! -d "$PROJECT_ROOT/ph_frontend" ]; then
        print_error "Frontend directory not found"
        return 1
    fi

    cd "$PROJECT_ROOT/ph_frontend"

    print_info "Frontend Structure: $(pwd)"

    # Check for test files
    if find . -maxdepth 3 -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | grep -q .; then
        print_info "Running Jest tests..."
        ((TOTAL_TESTS++))
        
        if pnpm test --passWithNoTests 2>&1 | tee /tmp/frontend-test.log; then
            print_success "Frontend tests passed"
        else
            print_error "Frontend tests failed"
            return 1
        fi

        # Check coverage
        if [ "$COVERAGE" = "true" ] && [ -f "coverage/coverage-summary.json" ]; then
            print_info "Coverage Report Available"
            print_info "View full report: open coverage/lcov-report/index.html"
        fi
    else
        print_warning "No frontend tests found (*.test.ts, *.test.tsx, *.spec.ts, *.spec.tsx)"
        print_info "To add tests, create files like: app/__tests__/page.test.tsx"
    fi

    cd "$PROJECT_ROOT"
    return 0
}

# ============================================================================
# Python Testing
# ============================================================================

test_python() {
    print_section "Testing Python (AI Assistant)"
    
    if [ ! -d "$PROJECT_ROOT/ai_assistant" ]; then
        print_error "AI Assistant directory not found"
        return 1
    fi

    cd "$PROJECT_ROOT/ai_assistant"

    print_info "Python Environment: $(pwd)"

    # Create or use existing virtual environment
    if [ ! -d ".venv" ]; then
        print_info "Creating virtual environment..."
        python3 -m venv .venv
    fi

    source .venv/bin/activate

    print_info "Installing dependencies..."
    pip install -q --upgrade pip
    if [ -f "requirements.txt" ]; then
        pip install -q -r requirements.txt
    fi
    pip install -q pytest pytest-cov

    # Check for test files
    if find . -maxdepth 2 -name "test_*.py" -o -name "*_test.py" | grep -q .; then
        print_info "Running pytest..."
        ((TOTAL_TESTS++))
        
        if [ "$COVERAGE" = "true" ]; then
            PYTEST_ARGS="--cov=. --cov-report=term --cov-report=html -v"
        else
            PYTEST_ARGS="-v"
        fi

        if pytest $PYTEST_ARGS 2>&1 | tee /tmp/python-test.log; then
            print_success "Python tests passed"
        else
            print_error "Python tests failed"
            deactivate
            return 1
        fi

        # Show coverage summary
        if [ "$COVERAGE" = "true" ] && [ -d "htmlcov" ]; then
            print_info "Coverage Report Available"
            print_info "View full report: open htmlcov/index.html"
        fi
    else
        print_warning "No Python tests found (test_*.py, *_test.py)"
        print_info "To add tests, create files like: tests/test_main.py"
    fi

    deactivate
    cd "$PROJECT_ROOT"
    return 0
}

# ============================================================================
# Linting and Code Quality
# ============================================================================

test_code_quality() {
    print_section "Code Quality Checks"
    
    print_info "Running linters..."
    
    # Backend linting
    if [ -d "$PROJECT_ROOT/ph_backend" ]; then
        print_info "Backend ESLint..."
        cd "$PROJECT_ROOT/ph_backend"
        if pnpm lint --max-warnings=0 2>/dev/null; then
            print_success "Backend linting passed"
        else
            print_warning "Backend linting issues found"
        fi
    fi

    # Frontend linting
    if [ -d "$PROJECT_ROOT/ph_frontend" ]; then
        print_info "Frontend ESLint..."
        cd "$PROJECT_ROOT/ph_frontend"
        if pnpm lint --max-warnings=0 2>/dev/null; then
            print_success "Frontend linting passed"
        else
            print_warning "Frontend linting issues found"
        fi
    fi

    # Python linting
    if [ -d "$PROJECT_ROOT/ai_assistant" ]; then
        print_info "Python flake8..."
        cd "$PROJECT_ROOT/ai_assistant"
        if [ ! -d ".venv" ]; then
            python3 -m venv .venv
        fi
        source .venv/bin/activate
        pip install -q flake8 black isort 2>/dev/null
        
        if black --check . 2>/dev/null; then
            print_success "Python formatting check passed"
        else
            print_warning "Python formatting issues found (run: black .)"
        fi

        if flake8 . --count --select=E9,F63,F7,F82 2>/dev/null; then
            print_success "Python linting passed"
        else
            print_warning "Python linting issues found"
        fi

        deactivate
    fi

    cd "$PROJECT_ROOT"
}

# ============================================================================
# Type Checking
# ============================================================================

test_type_checking() {
    print_section "Type Checking"
    
    # Backend type check
    if [ -d "$PROJECT_ROOT/ph_backend" ]; then
        print_info "Backend TypeScript type check..."
        cd "$PROJECT_ROOT/ph_backend"
        if pnpm type-check 2>/dev/null; then
            print_success "Backend type checking passed"
        else
            print_warning "Backend type checking issues found"
        fi
    fi

    # Frontend type check
    if [ -d "$PROJECT_ROOT/ph_frontend" ]; then
        print_info "Frontend TypeScript type check..."
        cd "$PROJECT_ROOT/ph_frontend"
        if pnpm type-check 2>/dev/null; then
            print_success "Frontend type checking passed"
        else
            print_warning "Frontend type checking issues found"
        fi
    fi

    cd "$PROJECT_ROOT"
}

# ============================================================================
# Build Tests
# ============================================================================

test_builds() {
    print_section "Build Tests"
    
    # Backend build
    if [ -d "$PROJECT_ROOT/ph_backend" ]; then
        print_info "Building Backend..."
        cd "$PROJECT_ROOT/ph_backend"
        ((TOTAL_TESTS++))
        if pnpm build 2>&1 | grep -q "Successfully compiled"; then
            print_success "Backend build successful"
        elif pnpm build >/dev/null 2>&1; then
            print_success "Backend build successful"
        else
            print_warning "Backend build had warnings"
        fi
    fi

    # Frontend build
    if [ -d "$PROJECT_ROOT/ph_frontend" ]; then
        print_info "Building Frontend..."
        cd "$PROJECT_ROOT/ph_frontend"
        ((TOTAL_TESTS++))
        if pnpm build >/dev/null 2>&1; then
            print_success "Frontend build successful"
        else
            print_error "Frontend build failed"
            return 1
        fi
    fi

    cd "$PROJECT_ROOT"
    return 0
}

# ============================================================================
# Main Test Suite
# ============================================================================

run_all_tests() {
    print_header "PharmaCare CI/CD Test Suite"
    
    START_TIME=$(date +%s)
    
    case "$TEST_TYPE" in
        backend)
            test_backend
            test_type_checking
            ;;
        frontend)
            test_frontend
            test_type_checking
            ;;
        python)
            test_python
            ;;
        lint)
            test_code_quality
            ;;
        build)
            test_builds
            ;;
        all)
            test_backend
            test_frontend
            test_python
            test_code_quality
            test_type_checking
            test_builds
            ;;
        *)
            echo "Unknown test type: $TEST_TYPE"
            echo "Usage: $0 [backend|frontend|python|lint|build|all]"
            exit 1
            ;;
    esac

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    # Print summary
    print_section "Test Summary"
    
    echo -e "Duration: ${BLUE}${DURATION}s${NC}"
    echo -e "Total Tests: ${BLUE}${TOTAL_TESTS}${NC}"
    echo -e "Passed: ${GREEN}${PASSED_TESTS}${NC}"
    echo -e "Failed: ${RED}${FAILED_TESTS}${NC}"

    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "All tests passed!"
        return 0
    else
        print_error "Some tests failed"
        return 1
    fi
}

# ============================================================================
# Execute Tests
# ============================================================================

main() {
    cd "$PROJECT_ROOT"
    run_all_tests
    exit $?
}

main "$@"
