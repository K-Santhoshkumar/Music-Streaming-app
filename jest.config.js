export default {
  testEnvironment: "node",
  transform: {},
  setupFilesAfterEnv: ["<rootDir>/src/__test__/setup.js"],
  testMatch: ["<rootDir>/src/__test__/**/*.(test|spec).js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
