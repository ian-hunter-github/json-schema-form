#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const versionArg = args.find(arg => !arg.startsWith('--'));

if (showHelp) {
  console.log(`
Usage: node version-bump.js [newVersion] [options]

Options:
  --help, -h    Show this help message
  newVersion    Optional version to set (e.g. 1.2.3), defaults to patch bump

This script will:
1. Update all package.json versions in the monorepo
2. Update inter-dependencies between packages
3. Show a summary of changes made
`);
  process.exit(0);
}

// Find all package.json files
const packageFiles = [];
function findPackageFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findPackageFiles(fullPath);
    } else if (file === 'package.json') {
      packageFiles.push(fullPath);
    }
  }
}

findPackageFiles(process.cwd());

if (packageFiles.length === 0) {
  console.error('No package.json files found');
  process.exit(1);
}

// Read all packages
const packages = packageFiles.map(file => {
  const content = fs.readFileSync(file, 'utf8');
  return {
    path: file,
    dir: path.dirname(file),
    name: path.basename(path.dirname(file)),
    data: JSON.parse(content),
    originalContent: content
  };
});

// Determine new version
let newVersion;
if (versionArg) {
  if (!/^\d+\.\d+\.\d+$/.test(versionArg)) {
    console.error(`Invalid version format: ${versionArg}. Use semver format (e.g. 1.2.3)`);
    process.exit(1);
  }
  newVersion = versionArg;
} else {
  // Get current version from root package
  const rootPackage = packages.find(p => p.path === path.join(process.cwd(), 'package.json'));
  if (!rootPackage) {
    console.error('Could not find root package.json');
    process.exit(1);
  }
  const currentVersion = rootPackage.data.version;
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  newVersion = `${major}.${minor}.${patch + 1}`;
}

console.log(`Updating all packages to version ${newVersion}\n`);

// Update versions and dependencies
const changes = [];
for (const pkg of packages) {
  let changed = false;
  
  // Update package version
  if (pkg.data.version !== newVersion) {
    changes.push(`- ${pkg.name}: version ${pkg.data.version} → ${newVersion}`);
    pkg.data.version = newVersion;
    changed = true;
  }

  // Update dependencies
  for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
    if (pkg.data[depType]) {
      for (const [depName, depVersion] of Object.entries(pkg.data[depType])) {
        // Check if this is an internal dependency
        if (packages.some(p => p.data.name === depName)) {
          if (depVersion !== `^${newVersion}`) {
            changes.push(`- ${pkg.name}: ${depType}.${depName} ${depVersion} → ^${newVersion}`);
            pkg.data[depType][depName] = `^${newVersion}`;
            changed = true;
          }
        }
      }
    }
  }

  // Write changes if any
  if (changed) {
    fs.writeFileSync(pkg.path, JSON.stringify(pkg.data, null, 2) + '\n');
  }
}

// Output summary
if (changes.length > 0) {
  console.log('Changes made:');
  console.log(changes.join('\n'));
  console.log(`\nSuccessfully updated ${changes.length} version references across ${packages.length} packages`);
} else {
  console.log('No version changes needed - all packages already up to date');
}
