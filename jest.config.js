/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^@models/(.*?)(\.js)?$': '<rootDir>/src/models/$1',
    '^@factories/(.*?)(\.js)?$': '<rootDir>/src/factories/$1',
    '^@repositories/(.*?)(\.js)?$': '<rootDir>/src/repositories/$1',
    '^@functions/(.*?)(\.js)?$': '<rootDir>/src/functions/$1',
    '^@utils/(.*?)(\.js)?$': '<rootDir>/src/utils/$1',
    '^(\.{1,2}/.*)\.js$': '$1',
  },
};
