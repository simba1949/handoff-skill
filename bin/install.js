#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SOURCE_ROOT = path.resolve(__dirname, '..');
const DEFAULT_TARGET = path.join(os.homedir(), '.claude', 'skills', 'handoff');
const EXCLUDED_NAMES = new Set([
  '.git',
  '.claude',
  '.handoff',
  'HANDOFF.md',
  'node_modules',
  'package-lock.json',
  'npm-shrinkwrap.json',
]);
const INCLUDED_ROOTS = [
  '.claude-plugin',
  'commands',
  'docs',
  'SKILL.md',
  'HANDOFF-template.md',
  'LICENSE',
  'README.md',
  'plugin.json',
];

function printHelp() {
  console.log(`Install the handoff Claude Code plugin.

Usage:
  npx --yes github:simba1949/handoff-skill [options]\n\nOptions:\n  --target <dir>  Install into a custom directory\n  --force         Replace an existing installation\n  --dry-run       Show what would be installed without writing\n  --help          Show this help\n\nDefault target: ${DEFAULT_TARGET}\n`);
}

function parseArgs(argv) {
  const options = { target: DEFAULT_TARGET, force: false, dryRun: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--target' || arg === '-t') {
      const target = argv[index + 1];
      if (!target || target.startsWith('-')) {
        throw new Error('--target requires a directory path.');
      }
      options.target = path.resolve(target);
      index += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function assertSource() {
  for (const relativePath of INCLUDED_ROOTS) {
    const sourcePath = path.join(SOURCE_ROOT, relativePath);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Package is missing required file: ${relativePath}`);
    }
  }
}

function copyTree(sourcePath, targetPath, relativePath, dryRun) {
  const entry = fs.lstatSync(sourcePath);
  if (entry.isDirectory()) {
    if (!dryRun) fs.mkdirSync(targetPath, { recursive: true });
    for (const child of fs.readdirSync(sourcePath)) {
      if (EXCLUDED_NAMES.has(child)) continue;
      copyTree(
        path.join(sourcePath, child),
        path.join(targetPath, child),
        path.join(relativePath, child),
        dryRun,
      );
    }
    return;
  }

  if (!dryRun) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
  console.log(`  ${relativePath}`);
}

function install(options) {
  assertSource();
  const targetExists = fs.existsSync(options.target);

  if (targetExists && !options.force && !options.dryRun) {
    throw new Error(`Target already exists: ${options.target}\nUse --force to replace it.`);
  }

  console.log(`${options.dryRun ? 'Would install' : 'Installing'} handoff to:`);
  console.log(`  ${options.target}`);

  if (targetExists && options.force && !options.dryRun) {
    fs.rmSync(options.target, { recursive: true, force: true });
  }

  for (const relativePath of INCLUDED_ROOTS) {
    copyTree(
      path.join(SOURCE_ROOT, relativePath),
      path.join(options.target, relativePath),
      relativePath,
      options.dryRun,
    );
  }

  if (options.dryRun) {
    console.log('\nDry run complete. No files were changed.');
    return;
  }

  console.log('\nInstallation complete. Restart Claude Code, then use:');
  console.log('  /handoff:write');
  console.log('  /handoff:read');
  console.log('  /handoff:update');
  console.log('  /handoff:archive');
  console.log('  /handoff:help');
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
  } else {
    install(options);
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
