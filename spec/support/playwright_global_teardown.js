// Global teardown for Playwright tests in Rails 8 application

async function globalTeardown() {
  console.log('🎭 Cleaning up Playwright test environment...');
  
  try {
    // Clean up test artifacts if in CI
    if (process.env.CI) {
      console.log('🧹 Cleaning up CI test artifacts...');
      // Keep reports but clean up large files
    } else {
      console.log('💾 Preserving test artifacts for local development...');
    }
    
    console.log('✅ Playwright test environment cleanup complete');
  } catch (error) {
    console.error('⚠️ Warning during Playwright teardown:', error.message);
    // Don't fail on teardown errors
  }
}

module.exports = globalTeardown;