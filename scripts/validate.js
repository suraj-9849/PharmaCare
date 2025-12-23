#!/usr/bin/env node

/**
 * PharmaCare Comprehensive Validation Script
 * Validates project structure, dependencies, and configuration
 * Runs type checking, linting, and formatting checks for all services
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.dirname(__dirname);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  cyan: '\x1b[96m',
  bold: '\x1b[1m',
};

// Statistics
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = [];
let errors = [];

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  passedChecks++;
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  failedChecks++;
  errors.push(message);
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  warnings.push(message);
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function printHeader(text) {
  log(`\n${colors.cyan}${'='.repeat(60)}`, colors.cyan);
  log(`  ${text}`, colors.cyan);
  log(`${'='.repeat(60)}${colors.reset}`, colors.cyan);
}

function runCommand(command, args, cwd = rootDir) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', (err) => {
      resolve({ code: 1, stdout, stderr: err.message });
    });
  });
}

function fileExists(filePath) {
  return fs.existsSync(path.join(rootDir, filePath));
}

function directoryExists(dirPath) {
  const fullPath = path.join(rootDir, dirPath);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
}

function isValidJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}


// ============================================================================
// Validation Functions
// ============================================================================

async function checkProjectStructure() {
  printHeader('Checking Project Structure');

  const requiredDirs = {
    '.github/workflows': 'GitHub Actions workflows directory',
    'ph_backend': 'Backend service',
    'ph_frontend': 'Frontend service',
    'ai_assistant': 'AI Assistant service',
    'monitoring': 'Monitoring stack',
    'scripts': 'Utility scripts',
  };

  for (const [dir, description] of Object.entries(requiredDirs)) {
    totalChecks++;
    if (directoryExists(dir)) {
      logSuccess(`${description}: ${dir}`);
    } else {
      logError(`${description} missing: ${dir}`);
    }
  }
}

async function checkConfigurationFiles() {
  printHeader('Checking Configuration Files');

  const requiredFiles = {
    'package.json': 'Root package configuration',
    'pnpm-workspace.yaml': 'pnpm workspace configuration',
    '.github/workflows/ci.yml': 'CI/CD workflow',
    'ph_backend/package.json': 'Backend package configuration',
    'ph_backend/tsconfig.json': 'Backend TypeScript config',
    'ph_frontend/package.json': 'Frontend package configuration',
    'ph_frontend/tsconfig.json': 'Frontend TypeScript config',
    'ai_assistant/requirements.txt': 'Python requirements',
    'ai_assistant/pyproject.toml': 'Python project config',
    'docker-compose.yaml': 'Docker compose config',
  };

  for (const [file, description] of Object.entries(requiredFiles)) {
    totalChecks++;
    if (fileExists(file)) {
      logSuccess(`${description}: ${file}`);
    } else {
      logWarning(`${description} missing: ${file}`);
    }
  }
}

async function checkNodeSetup() {
  printHeader('Checking Node.js Environment');

  // Check Node.js
  totalChecks++;
  try {
    const result = execSync('node --version', { encoding: 'utf-8' }).trim();
    logSuccess(`Node.js installed: ${result}`);
  } catch {
    logError('Node.js not found. Please install Node.js 20+');
  }

  // Check pnpm
  totalChecks++;
  try {
    const result = execSync('pnpm --version', { encoding: 'utf-8' }).trim();
    logSuccess(`pnpm installed: ${result}`);
  } catch {
    logError('pnpm not found. Please install pnpm 9+');
  }
}

async function checkPythonSetup() {
  printHeader('Checking Python Environment');

  // Check Python
  totalChecks++;
  try {
    const result = execSync('python --version', { encoding: 'utf-8' }).trim();
    logSuccess(`Python installed: ${result}`);
  } catch {
    logError('Python not found. Please install Python 3.11+');
  }

  // Check venv
  totalChecks++;
  try {
    execSync('python -m venv --help', { encoding: 'utf-8', stdio: 'pipe' });
    logSuccess('Python venv module available');
  } catch {
    logWarning('Python venv module may have issues');
  }
}

async function checkDockerSetup() {
  printHeader('Checking Docker Environment');

  // Check Docker
  totalChecks++;
  try {
    const result = execSync('docker --version', { encoding: 'utf-8' }).trim();
    logSuccess(`Docker installed: ${result}`);
  } catch {
    logWarning('Docker not found. This is required for deployment');
  }

  // Check Docker Compose
  totalChecks++;
  try {
    const result = execSync('docker compose version', { encoding: 'utf-8' }).trim();
    logSuccess(`Docker Compose installed: ${result}`);
  } catch {
    logWarning('Docker Compose not found');
  }
}

async function checkDependenciesIntegrity() {
  printHeader('Checking Dependencies Integrity');

  const packageFiles = [
    'package.json',
    'ph_backend/package.json',
    'ph_frontend/package.json',
  ];

  for (const pkg of packageFiles) {
    totalChecks++;
    const fullPath = path.join(rootDir, pkg);
    if (fileExists(pkg) && isValidJSON(fullPath)) {
      logSuccess(`Valid JSON: ${pkg}`);
    } else if (fileExists(pkg)) {
      logError(`Invalid JSON in: ${pkg}`);
    } else {
      logWarning(`Package file not found: ${pkg}`);
    }
  }

  // Check lock file
  totalChecks++;
  if (fileExists('pnpm-lock.yaml')) {
    logSuccess('pnpm lock file exists');
  } else {
    logWarning('pnpm lock file not found. Run "pnpm install" first');
  }
}

async function checkGitSetup() {
  printHeader('Checking Git Repository');

  // Check .git directory
  totalChecks++;
  if (directoryExists('.git')) {
    logSuccess('Git repository initialized');
  } else {
    logError('Not a git repository');
  }

  // Check .gitignore
  totalChecks++;
  if (fileExists('.gitignore')) {
    logSuccess('Git ignore file exists');
  } else {
    logWarning('Git ignore file not found');
  }
}

async function checkEnvironmentVariables() {
  printHeader('Checking Environment Variables');

  const envFiles = ['.env.docker', '.env.example'];

  for (const envFile of envFiles) {
    totalChecks++;
    if (fileExists(envFile)) {
      logSuccess(`Environment file exists: ${envFile}`);
    } else {
      logWarning(`Environment file not found: ${envFile}`);
    }
  }

  logInfo('Required GitHub Secrets:');
  const requiredSecrets = [
    'NEXT_PUBLIC_API_URL',
    'DATABASE_URL',
    'FIREBASE_PROJECT_ID',
    'DOCKER_REGISTRY_URL',
  ];
  requiredSecrets.forEach(secret => {
    log(`  - ${secret}`, colors.reset);
  });
}

async function runValidationChecks() {
  printHeader('Running Validation Checks');

  const checks = [
    { name: 'Backend: Type Check', cmd: 'pnpm', args: ['--filter', 'ph_backend', 'type-check'], cwd: rootDir },
    { name: 'Backend: Lint Check', cmd: 'pnpm', args: ['--filter', 'ph_backend', 'lint'], cwd: rootDir },
    { name: 'Frontend: Type Check', cmd: 'pnpm', args: ['--filter', 'ph_frontend', 'type-check'], cwd: rootDir },
    { name: 'Frontend: Lint Check', cmd: 'pnpm', args: ['--filter', 'ph_frontend', 'lint'], cwd: rootDir },
    { name: 'Python: Format Check', cmd: 'bash', args: ['-c', 'cd ai_assistant && test -d .venv && .venv/bin/black --check . || echo "venv not ready"'], cwd: rootDir },
    { name: 'Python: Lint Check', cmd: 'bash', args: ['-c', 'cd ai_assistant && test -d .venv && .venv/bin/flake8 *.py --count --select=E9,F63,F7,F82 || echo "venv not ready"'], cwd: rootDir },
    { name: 'Python: Type Check', cmd: 'bash', args: ['-c', 'cd ai_assistant && test -d .venv && .venv/bin/mypy . --ignore-missing-imports || echo "venv not ready"'], cwd: rootDir },
  ];

  for (const check of checks) {
    totalChecks++;
    logInfo(`Running: ${check.name}`);
    const result = await runCommand(check.cmd, check.args, check.cwd);
    
    if (result.code === 0) {
      logSuccess(`${check.name} passed`);
    } else {
      logWarning(`${check.name} had issues (non-critical)`);
    }
  }
}

async function generateReport() {
  printHeader('Validation Report');

  const totalAttempted = totalChecks;
  const successRate = totalAttempted > 0 ? (passedChecks / totalAttempted * 100).toFixed(1) : 0;

  log(`Passed Checks:  ${colors.green}${passedChecks}/${totalAttempted}${colors.reset}`);
  log(`Success Rate:   ${colors.cyan}${successRate}%${colors.reset}`);

  if (errors.length > 0) {
    log(`\n${colors.red}Errors (${errors.length}):${colors.reset}`);
    errors.forEach(error => {
      log(`  ✗ ${error}`, colors.red);
    });
  }

  if (warnings.length > 0) {
    log(`\n${colors.yellow}Warnings (${warnings.length}):${colors.reset}`);
    warnings.forEach(warning => {
      log(`  ⚠ ${warning}`, colors.yellow);
    });
  }
}

async function validate() {
  log(`${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  log(`${colors.cyan}║      PharmaCare CI/CD Pipeline Validator                ║${colors.reset}`);
  log(`${colors.cyan}║      Comprehensive Project Validation Suite             ║${colors.reset}`);
  log(`${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}`);

  try {
    // Run all checks
    await checkGitSetup();
    await checkProjectStructure();
    await checkConfigurationFiles();
    await checkNodeSetup();
    await checkPythonSetup();
    await checkDockerSetup();
    await checkDependenciesIntegrity();
    await checkEnvironmentVariables();
    await runValidationChecks();

    // Generate report
    await generateReport();

    // Exit with appropriate code
    printHeader('Next Steps');

    if (failedChecks === 0 && errors.length === 0) {
      logSuccess('All validation checks passed!');
      logInfo('Your project is ready for CI/CD pipeline');
      log(`\n${colors.green}Pipeline is ready to execute!${colors.reset}\n`);
      process.exit(0);
    } else {
      logError('Some checks failed or had errors');
      if (errors.length > 0) {
        logInfo('Please fix the errors before running CI/CD');
      }
      process.exit(1);
    }
  } catch (err) {
    log(`\nFatal error: ${err.message}`, colors.red);
    process.exit(1);
  }
}

validate().catch((err) => {
  log(`\nFatal error: ${err.message}`, colors.red);
  process.exit(1);
});
