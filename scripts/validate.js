#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
};

let failed = false;

function printHeader(text) {
  console.log('');
  console.log(`${colors.blue}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║        PharmaCare - Pre-Push Validation Script       ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
}

function printSection(text) {
  console.log('');
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}  ${text}${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

function runCheck(name, command, dir) {
  console.log(`\n${colors.yellow}Running: ${name}${colors.reset}`);

  try {
    const cwd = dir ? path.join(process.cwd(), dir) : process.cwd();
    execSync(command, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });
    console.log(`${colors.green}✓ ${name} passed${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ ${name} failed${colors.reset}`);
    failed = true;
  }
}

// Main validation flow
printHeader();

// Backend checks
printSection('Backend Validation (ph_backend)');
if (!fs.existsSync('ph_backend')) {
  console.log(`${colors.red}✗ Backend directory not found!${colors.reset}`);
  failed = true;
} else {
  runCheck('Backend: Type Check', 'pnpm type-check', 'ph_backend');
  runCheck('Backend: Lint Check', 'pnpm lint', 'ph_backend');
  runCheck('Backend: Format Check', 'pnpm format:check', 'ph_backend');
}

// Frontend checks
printSection('Frontend Validation (ph_frontend)');
if (!fs.existsSync('ph_frontend')) {
  console.log(`${colors.red}✗ Frontend directory not found!${colors.reset}`);
  failed = true;
} else {
  runCheck('Frontend: Type Check', 'pnpm type-check', 'ph_frontend');
  runCheck('Frontend: Lint Check', 'pnpm lint', 'ph_frontend');
  runCheck('Frontend: Format Check', 'pnpm format:check', 'ph_frontend');
}

// Summary
console.log('');
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.blue}  Validation Summary${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log('');

if (!failed) {
  console.log(`${colors.green}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.green}║                 ALL CHECKS PASSED! ✓                  ║${colors.reset}`);
  console.log(`${colors.green}║          Your code is ready to be pushed!             ║${colors.reset}`);
  console.log(`${colors.green}╚═══════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  process.exit(0);
} else {
  console.log(`${colors.red}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.red}║              SOME CHECKS FAILED! ✗                    ║${colors.reset}`);
  console.log(`${colors.red}║                                                       ║${colors.reset}`);
  console.log(`${colors.red}║  Please fix the errors above before pushing:         ║${colors.reset}`);
  console.log(`${colors.red}║                                                       ║${colors.reset}`);
  console.log(`${colors.red}║  - Run 'pnpm lint:fix' to fix linting issues         ║${colors.reset}`);
  console.log(`${colors.red}║  - Run 'pnpm format' to fix formatting issues        ║${colors.reset}`);
  console.log(`${colors.red}║  - Fix TypeScript errors manually                    ║${colors.reset}`);
  console.log(`${colors.red}╚═══════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  process.exit(1);
}
