const fs = require('fs');

['c:/Users/DELL/OneDrive/Desktop/societychef/apps/mobile/app/(consumer)/_layout.tsx', 'c:/Users/DELL/OneDrive/Desktop/societychef/apps/mobile/app/(ops)/_layout.tsx'].forEach(p => {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/  const Colors = useThemeStore\(\(s\) => s\.colors\);\n  const styles = getStyles\(Colors\);\n/g, '');
  fs.writeFileSync(p, c);
});

const subComponents = [
  'app/(chef)/onboarding.tsx',
  'app/(chef)/orders.tsx',
  'app/(consumer)/notifications.tsx',
  'app/(consumer)/orders.tsx',
  'app/(consumer)/profile.tsx',
];

subComponents.forEach(file => {
  const p = 'c:/Users/DELL/OneDrive/Desktop/societychef/apps/mobile/' + file;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/^function\s+[A-Za-z0-9_]+\s*(?:<[^>]+>)?\s*\([^)]*\)\s*\{/gm, match => {
    return match + '\n  const Colors = useThemeStore((s) => s.colors);\n  const styles = getStyles(Colors);\n';
  });
  fs.writeFileSync(p, c);
});

let badgePath = 'c:/Users/DELL/OneDrive/Desktop/societychef/apps/mobile/components/ui/Badge.tsx';
let bc = fs.readFileSync(badgePath, 'utf8');
if (!bc.includes('getToneStyles')) {
  bc = bc.replace('const toneStyles: Record<Tone, object> = {', 'const getToneStyles = (Colors: any): Record<Tone, object> => ({');
  bc = bc.replace('  default: { backgroundColor: Colors.pillInactive },\n};', '  default: { backgroundColor: Colors.pillInactive },\n});');
  bc = bc.replace('toneStyles[tone]', 'getToneStyles(Colors)[tone]');
  fs.writeFileSync(badgePath, bc);
}

let buttonPath = 'c:/Users/DELL/OneDrive/Desktop/societychef/apps/mobile/components/ui/Button.tsx';
let btc = fs.readFileSync(buttonPath, 'utf8');
if (!btc.includes('getVariantContainerStyles')) {
  btc = btc.replace('const variantContainerStyles: Record<Variant, ViewStyle> = {', 'const getVariantContainerStyles = (Colors: any): Record<Variant, ViewStyle> => ({');
  btc = btc.replace("  ghost: {\n    backgroundColor: 'transparent',\n  },\n};", "  ghost: {\n    backgroundColor: 'transparent',\n  },\n});");
  
  btc = btc.replace('const variantTextStyles: Record<Variant, object> = {', 'const getVariantTextStyles = (Colors: any): Record<Variant, object> => ({');
  btc = btc.replace("  ghost: { color: Colors.primary },\n};", "  ghost: { color: Colors.primary },\n});");
  
  btc = btc.replace('variantContainerStyles[variant]', 'getVariantContainerStyles(Colors)[variant]');
  btc = btc.replace('variantTextStyles[variant]', 'getVariantTextStyles(Colors)[variant]');
  fs.writeFileSync(buttonPath, btc);
}
