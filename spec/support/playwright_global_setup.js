// Global setup for Playwright tests in Rails 8 application
const { execSync } = require('child_process');

async function globalSetup() {
  console.log('🎭 Setting up Playwright test environment...');
  
  try {
    // Setup test database
    console.log('📊 Setting up test database...');
    execSync('RAILS_ENV=test bin/rails db:test:prepare', { 
      stdio: 'inherit',
      env: { ...process.env, RAILS_ENV: 'test' }
    });
    
    // Precompile assets if needed
    console.log('🎨 Ensuring assets are compiled...');
    execSync('RAILS_ENV=test bin/rails assets:precompile', { 
      stdio: 'inherit',
      env: { ...process.env, RAILS_ENV: 'test' }
    });
    
    // Clear tmp directories
    console.log('🧹 Cleaning up temporary files...');
    execSync('rm -rf tmp/screenshots tmp/playwright-*', { stdio: 'inherit' });
    execSync('mkdir -p tmp/screenshots tmp/playwright-artifacts tmp/playwright-report', { stdio: 'inherit' });
    
    console.log('✅ Playwright test environment setup complete');
  } catch (error) {
    console.error('❌ Failed to setup Playwright test environment:', error.message);
    throw error;
  }
}

module.exports = globalSetup;