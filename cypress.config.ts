import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'upc13x',
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    execTimeout:1800000,
    defaultCommandTimeout: 10000,
    requestTimeout:30000,
    pageLoadTimeout:60000,
    responseTimeout:10000,
    viewportWidth: 1536,
    viewportHeight: 960,
    retries: {
      "runMode": 2,
      "openMode": 2
    },
  },
})
