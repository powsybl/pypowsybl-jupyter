module.exports = {
  verbose: true,
  automock: false,
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',

    // Trick because otherwise jest uses the pure ".js" version instead of the ESmodule version,
    // where SVG is not imported. There must be a better solution ...
    '@svgdotjs/svg.panzoom.js': '<rootDir>/node_modules/@svgdotjs/svg.panzoom.js/dist/svg.panzoom.esm.js'
  },
  preset: 'ts-jest/presets/js-with-babel',
  moduleFileExtensions: ['ts', 'tsx', 'esm.js', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/lib/', '/node_modules/'],
  testRegex: '/__tests__/.*.spec.ts[x]?$',
  transformIgnorePatterns: ['/node_modules/(?!(@jupyter(lab|-widgets)/.*|@svgdotjs/.*)/)'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
};
