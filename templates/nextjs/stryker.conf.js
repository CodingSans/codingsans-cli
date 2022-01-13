/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
  _comment:
    "This config was generated using 'stryker init'. Please see the guide for more information: https://stryker-mutator.io/docs/stryker-js/guides/angular",
  mutate: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.module.ts', '!src/main.ts', '!src/environments/*.ts'],
  testRunner: 'jest',
  jest: {
    configFile: 'jest.config.js',
  },
  reporters: ['progress', 'clear-text', 'html'],
  concurrency: 4,
  concurrency_comment: 'Recommended to use about half of your available cores when running stryker with angular',
  coverageAnalysis: 'perTest',
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.stryker.json',
  thresholds: {
    high: 90,
    low: 75,
    break: 60,
  },
};
