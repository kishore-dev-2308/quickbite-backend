module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000
};
