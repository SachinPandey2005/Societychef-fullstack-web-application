const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules') walk(p, callback);
    } else {
      callback(p);
    }
  });
}

walk('c:/Users/DELL/OneDrive/Desktop/societychef/apps/mobile', filePath => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  if (filePath.includes('colors.ts') || filePath.includes('useThemeStore.ts')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('constants/colors')) return;

  console.log('Processing', filePath);

  // 1. Calculate relative path to store
  const fileDir = path.dirname(filePath);
  const storeDir = path.resolve('c:/Users/DELL/OneDrive/Desktop/societychef/apps/mobile/store');
  let relPathToStore = path.relative(fileDir, storeDir).replace(/\\/g, '/');
  if (!relPathToStore.startsWith('.')) relPathToStore = './' + relPathToStore;

  // 2. Replace the Colors import with useThemeStore
  content = content.replace(
    /import\s+\{\s*Colors\s*\}\s+from\s+['"]([^'"]+)['"];?/g,
    `import { useThemeStore } from '${relPathToStore}/useThemeStore';`
  );

  // 3. Update StyleSheet.create to getStyles factory
  content = content.replace(
    /const styles = StyleSheet\.create\(\{/g,
    'const getStyles = (Colors: any) => StyleSheet.create({'
  );

  // 4. Inject `const Colors = useThemeStore((s) => s.colors); const styles = getStyles(Colors);` into components
  // Find component declarations (export default function X, export function X, const X = () =>)
  // This is a naive regex approach but should work for this codebase
  content = content.replace(
    /((?:export\s+)?(?:default\s+)?function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{)/g,
    `$1\n  const Colors = useThemeStore((s) => s.colors);\n  const styles = getStyles(Colors);\n`
  );

  // What about `const X = () => {`?
  // Let's assume most components are defined via `function`
  // I'll also add it to `const XYZ = ({ ... }) => {` if it's exported
  content = content.replace(
    /(export\s+const\s+[A-Za-z0-9_]+\s*=\s*(?:<[^>]+>\s*)?\([^)]*\)\s*=>\s*\{)/g,
    `$1\n  const Colors = useThemeStore((s) => s.colors);\n  const styles = getStyles(Colors);\n`
  );

  fs.writeFileSync(filePath, content);
});
