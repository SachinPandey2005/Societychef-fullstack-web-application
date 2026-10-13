// expo-router/entry is hoisted to the npm workspace root's node_modules in
// this monorepo, outside this app's own directory. Pointing package.json's
// "main" straight at that bare specifier made Expo CLI's export:embed (used
// by the Android release build) walk up from the entry file's resolved,
// external location to find a project root — landing on the workspace
// root's package.json instead of this one, and failing to resolve
// expo-router/entry.js from there. This local bridge file lives inside
// apps/mobile itself, so that walk-up correctly finds this app's own
// package.json; the bare specifier import below is then resolved by Metro's
// already-configured resolver (metro.config.js's nodeModulesPaths includes
// the workspace root), not Expo CLI's own entry-point detection.
import 'expo-router/entry';
