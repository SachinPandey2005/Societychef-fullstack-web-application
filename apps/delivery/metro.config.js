const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Monorepo setup
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

// Zustand CJS resolver for compatibility
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
