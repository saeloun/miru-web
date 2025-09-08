#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define the migration patterns
const migrationPatterns = [
  // Update internal_api imports to new service
  {
    from: /import\s+.*\s+from\s+["'].*\/apis\/invoices["']/g,
    to: 'import { invoicesApi } from "services/api"'
  },
  {
    from: /import\s+.*\s+from\s+["'].*\/apis\/clients["']/g,
    to: 'import { clientsApi } from "services/api"'
  },
  {
    from: /import\s+.*\s+from\s+["'].*\/apis\/projects["']/g,
    to: 'import { projectsApi } from "services/api"'
  },
  // Update API calls
  {
    from: /\/internal_api\/v1\//g,
    to: '/api/v1/'
  },
  // Update specific API method calls
  {
    from: /invoices\.get\(/g,
    to: 'invoicesApi.list('
  },
  {
    from: /invoices\.post\(/g,
    to: 'invoicesApi.create('
  },
  {
    from: /invoices\.patch\(/g,
    to: 'invoicesApi.update('
  },
  {
    from: /invoices\.destroy\(/g,
    to: 'invoicesApi.delete('
  },
  {
    from: /clients\.get\(/g,
    to: 'clientsApi.list('
  },
  {
    from: /clients\.post\(/g,
    to: 'clientsApi.create('
  },
  {
    from: /projects\.get\(/g,
    to: 'projectsApi.list('
  },
  {
    from: /projects\.post\(/g,
    to: 'projectsApi.create('
  }
];

// Find all TypeScript and JavaScript files
const srcDir = path.join(__dirname, '..', 'app', 'javascript', 'src');
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  cwd: srcDir,
  absolute: true,
  ignore: ['**/node_modules/**', '**/services/api.ts']
});

console.log(`Found ${files.length} files to process`);

let totalChanges = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let hasChanges = false;
  
  migrationPatterns.forEach(pattern => {
    if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    fs.writeFileSync(file, content);
    totalChanges++;
    console.log(`✓ Updated: ${path.relative(srcDir, file)}`);
  }
});

console.log(`\n✅ Migration complete! Updated ${totalChanges} files.`);
console.log('Next steps:');
console.log('1. Run tests to ensure everything works');
console.log('2. Check for any TypeScript compilation errors');
console.log('3. Test the application in the browser');