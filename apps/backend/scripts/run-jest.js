try {
  const jestBinPath = require.resolve('jest/bin/jest');
  require(jestBinPath);
} catch (err) {
  console.error('Failed to run Jest:', err);
  process.exit(1);
}
