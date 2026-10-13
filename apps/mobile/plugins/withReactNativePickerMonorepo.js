const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to ensure `@react-native-picker/picker` resolves `react-native`
 * in an npm workspace monorepo where `react-native` is hoisted to the workspace root node_modules.
 */
module.exports = function withReactNativePickerMonorepo(config) {
  return withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    const rnNodeModulesDirCode = `
// Ensure react-native location is exposed for monorepo Gradle autolinking (e.g. @react-native-picker/picker)
ext {
  try {
    REACT_NATIVE_NODE_MODULES_DIR = new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim()).getParentFile().getAbsoluteFile()
  } catch (Exception e) {
    REACT_NATIVE_NODE_MODULES_DIR = new File(rootDir, "../node_modules/react-native")
  }
}
`;

    if (!buildGradle.includes('REACT_NATIVE_NODE_MODULES_DIR')) {
      config.modResults.contents = rnNodeModulesDirCode + '\n' + buildGradle;
    }

    return config;
  });
};
