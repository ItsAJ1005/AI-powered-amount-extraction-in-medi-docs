// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

// Add global test timeout (can be overridden in individual tests)
jest.setTimeout(30000);

// Mock console methods to keep test output clean
const originalConsole = { ...console };

global.beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    // Keep error and warn visible for test failures
    error: originalConsole.error,
    warn: originalConsole.warn,
  };
});

global.afterAll(() => {
  global.console = originalConsole;
});
