module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: false, // Disable coverage for now
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!src/app.js',
    '!src/server.js',
    '!**/__tests__/**',
    '!**/*.test.js'
  ],
  // Temporarily disable coverage threshold
  // coverageThreshold: {
  //   global: {
  //     branches: 50,
  //     functions: 50,
  //     lines: 50,
  //     statements: 50
  //   }
  // },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  testTimeout: 30000 // 30 seconds timeout for tests
};
