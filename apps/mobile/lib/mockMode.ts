// Whether the app should use the local mock data layer (services/mock)
// instead of the real backend. Previously derived from whether real
// Supabase credentials were configured — a leftover from before the
// Supabase->Neon migration, now backwards (the app talks to the backend/
// Neon directly, nothing here needs Supabase at all). Explicit opt-in
// instead: unset or 'false' means real backend, 'true' forces mock mode
// for local UI work without a backend running.
export const isMockMode = process.env.EXPO_PUBLIC_FORCE_MOCK === 'true';
