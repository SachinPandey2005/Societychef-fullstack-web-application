const T = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  primary: '#0F766E',
  primaryDeep: '#0D665C',
  primaryLight: '#CCFBF1',
  dark: '#0F172A',
  muted: '#64748B',
  secondary: '#22C55E',
  accent: '#F97316',
  red: '#EF4444',
  gold: '#F59E0B',
  blue: '#3B82F6',
  pillInactive: '#F1F5F9',
  greenBadge: '#DCFCE7',
  goldBadge: '#FEF3C7',
  blueBadge: '#DBEAFE',
  redBadge: '#FEE2E2',
  white: '#FFFFFF',
} as const;

export type Token = keyof typeof T;
export default T;
