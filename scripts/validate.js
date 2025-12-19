#!/usr/bin/env node

/**
 * PharmaCare Validation Script
 * Runs type checking, linting, and formatting checks for all workspaces
 */

const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.dirname(__dirname);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, args, cwd) {
  return new Promise((resolve) => {
    log(`\nRunning: ${command} ${args.join(' ')}`, colors.blue);
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', (err) => {
      log(`Error executing command: ${err.message}`, colors.red);
      resolve(false);
    });
  });
}

async function validate() {
  log(`${colors.bold}╔════════════════════════════════════════╗`, colors.green);
  log(`${colors.bold}║   PharmaCare Validation Suite         ║`, colors.green);
  log(`${colors.bold}╚════════════════════════════════════════╝${colors.reset}`, colors.green);

  const results = [];
  const checks = [
    { name: 'Backend: Type Check', cmd: 'pnpm', args: ['backend:type-check'] },
    { name: 'Backend: Lint Check', cmd: 'pnpm', args: ['backend:lint'] },
    { name: 'Backend: Format Check', cmd: 'pnpm', args: ['backend:format:check'] },
    { name: 'Frontend: Type Check', cmd: 'pnpm', args: ['frontend:type-check'] },
    { name: 'Frontend: Lint Check', cmd: 'pnpm', args: ['frontend:lint'] },
    { name: 'Frontend: Format Check', cmd: 'pnpm', args: ['frontend:format:check'] },
    { name: 'Python: Type Check', cmd: 'uv', args: ['--directory', path.join(rootDir, 'ai_assistant'), 'run', 'mypy', '.'], cwd: rootDir },
    { name: 'Python: Lint Check', cmd: 'uv', args: ['--directory', path.join(rootDir, 'ai_assistant'), 'run', 'flake8', '.'], cwd: rootDir },
    { name: 'Python: Format Check', cmd: 'uv', args: ['--directory', path.join(rootDir, 'ai_assistant'), 'run', 'black', '--check', '.'], cwd: rootDir },
  ];

  for (const check of checks) {
    log(`\n${'='.repeat(50)}`, colors.yellow);
    log(`${check.name}`, colors.bold);

    const success = await runCommand(check.cmd, check.args, rootDir);
    results.push({ name: check.name, success });

    if (success) {
      log(`✓ ${check.name} passed`, colors.green);
    } else {
      log(`✗ ${check.name} failed`, colors.red);
    }
  }

  // Summary
  log(`\n${'='.repeat(50)}`, colors.yellow);
  log(`${colors.bold}Validation Summary`, colors.blue);
  log(`${'='.repeat(50)}`, colors.yellow);

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  results.forEach((result) => {
    const icon = result.success ? '✓' : '✗';
    const color = result.success ? colors.green : colors.red;
    log(`${icon} ${result.name}`, color);
  });

  log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`, colors.bold);

  if (failed > 0) {
    log('\n❌ Validation failed. Please fix the errors above.', colors.red);
    process.exit(1);
  } else {
    log('\n✅ All validation checks passed!', colors.green);
    process.exit(0);
  }
}

validate().catch((err) => {
  log(`\nFatal error: ${err.message}`, colors.red);
  process.exit(1);
});
