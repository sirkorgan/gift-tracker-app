module.exports = {
  verbose: true,
  displayName: 'api',
  rootDir: '.',
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['./jest-api.setup.js'],
  globalSetup: './jest-api.globalsetup.ts',
}

/*

API Tests:

- Need to create test db and initialize it (beforeAll)
- Need to cleanup test db (afterAll)

Challenges
- How to make it helpful for writing isolated function implementations?
  - test run has no state dependencies outside of describe block?
  - test run can be repeated without needing full db recreation (does watch mode do that?)

*/
