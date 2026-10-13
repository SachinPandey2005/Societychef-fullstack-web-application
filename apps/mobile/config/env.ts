import { Platform } from 'react-native';

// Backend listens on port 8080 (see apps/backend/src/config/index.ts), not 3000.
// Android emulator needs the 10.0.2.2 loopback alias to reach the host machine.
// See the matching comment in lib/apiClient.ts — Render is retired.
const defaultApiBase = 'https://backend-production-28028.up.railway.app';

export const env = { API_URL: `${process.env.EXPO_PUBLIC_API_URL || defaultApiBase}/api/v1` };
