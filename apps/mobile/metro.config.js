const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('mp4')) {
  config.resolver.assetExts.push('mp4');
}

// Monorepo setup: preserve Expo default watchFolders and add workspaceRoot
const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;
config.watchFolders = Array.from(new Set([...(config.watchFolders || []), workspaceRoot]));
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.blockList = [
  /[/\\]node_modules[/\\]lightningcss-(darwin|linux|freebsd)-.*/,
].concat(config.resolver.blockList || []);

// Zustand ships ESM (.mjs) files that use import.meta.env, which Metro cannot
// transform and which browsers reject when the bundle is served as a regular
// <script> (not type="module"). Force every zustand import to its CJS
// counterpart so the web bundle stays compatible.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('zustand')) {
    const subpath = moduleName.slice('zustand'.length).replace(/^\//, '');
    const filename = subpath ? `${subpath}.js` : 'index.js';
    try {
      const pkgPath = require.resolve('zustand/package.json', { paths: [__dirname] });
      const pkgDir = path.dirname(pkgPath);
      return {
        type: 'sourceFile',
        filePath: path.join(pkgDir, filename),
      };
    } catch (e) {
      // fallback
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
