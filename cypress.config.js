const cypress = require('cypress')

module.exports = cypress.defineConfig({
  video: false,
  e2e: {
    baseUrl: 'http://127.0.0.1:3000',
    specPattern: 'cypress/integration/**/*.spec.js',
    supportFile: 'cypress/support/index.js',
    testIsolation: false,
  },
})
