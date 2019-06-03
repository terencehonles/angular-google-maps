module.exports = {
  setupTestFrameworkScriptFile: './jest.setup.js',
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  testRegex: '(/packages/.*\\.spec)\\.ts$',
  moduleFileExtensions: [
    'js',
    'ts'
  ],
  collectCoverageFrom: [
    'packages/**/*.ts',
    '!packages/**/index.ts'
  ],
  globals: {
    google: {
      maps: {
        Animation: {BOUNCE: 1, DROP: 2, wn: 3, un: 4},
        MapTypeId: {
          ROADMAP: 'roadmap',
          SATELLITE: 'satellite',
          HYBRID: 'hybrid',
          TERRAIN: 'terrain',
        },
        StrokePosition: {CENTER: 0, INSIDE: 1, OUTSIDE: 2},
      }
    }
  }
};
