module.exports = {
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/.erb/mocks/fileMock.js',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },
  setupFiles: ['./.erb/scripts/check-build-exists.ts'],
  setupFilesAfterEnv: ['./.erb/scripts/jest-setup-crypto.ts'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
  testPathIgnorePatterns: ['/release/', '/.erb/dll/', '/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/__tests__/**',
  ],
  // Istanbul instrumentation breaks under the minimatch 9 override.
  coverageProvider: 'v8',
  coverageReporters: ['text-summary', 'cobertura'],
  // Regression gate. Current line coverage is about 18%; GitHub Code Quality
  // reports line coverage only, so the gate follows that metric.
  coverageThreshold: {
    global: {
      lines: 15,
    },
  },
  transform: {
    '\\.(ts|tsx|js|jsx)$': 'ts-jest',
  },
};
