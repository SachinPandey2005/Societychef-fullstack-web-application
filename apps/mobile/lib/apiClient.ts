import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

// Render is retired — this is now the only backend. A silent fallback here
// is exactly what caused a release build to quietly ship talking to the old
// Render backend (EXPO_PUBLIC_API_URL wasn't actually embedded in that
// build, confirmed by the shipped bundle containing onrender.com instead of
// railway.app) and surfaced as a confusing, hard-to-trace "Internal server
// error" on OTP verify. Keeping Railway as the default is intentional and
// fine; the dangerous part was Render being that default.
const defaultApiBase = 'https://backend-production-28028.up.railway.app';
const apiBase = process.env.EXPO_PUBLIC_API_URL || defaultApiBase;

let nonceCounter = 0;
const generateNonce = () => `${Date.now()}-${(nonceCounter++).toString(36)}-${Math.random().toString(36).slice(2)}`;

const getValidToken = async (): Promise<string | null> => {
  return useAuthStore.getState().token;
};

/**
 * Calls the backend's own /auth/refresh directly via fetch rather than
 * requestWithRetry, to avoid recursing through getHeaders/401-handling for
 * what is itself an unauthenticated endpoint.
 */
const refreshBackendSession = async (): Promise<string | null> => {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${apiBase}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const session = body?.data?.session;
    if (!session?.access_token) return null;
    useAuthStore.getState().setSession(session.access_token, session.refresh_token || refreshToken);
    return session.access_token;
  } catch (e) {
    console.warn('[mobile apiClient] Backend session refresh error:', e);
    return null;
  }
};

const getHeaders = async (): Promise<HeadersInit> => {
  const token = await getValidToken();
  return {
    'Content-Type': 'application/json',
    'X-Request-Timestamp': Date.now().toString(),
    'X-Request-Nonce': generateNonce(),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const requestWithRetry = async (
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any,
  isRetry = false
): Promise<any> => {
  const headers = await getHeaders();
  const options: RequestInit = {
    method,
    headers,
    ...(data && { body: JSON.stringify(data) })
  };

  const res = await fetch(`${apiBase}/api/v1${endpoint}`, options);

  if (res.status === 401 && !isRetry) {
    console.log(`[mobile apiClient] HTTP 401 for ${method} ${endpoint}. Attempting session refresh...`);
    const newToken = await refreshBackendSession();
    if (newToken) {
      console.log('[mobile apiClient] Session refreshed. Retrying request ONCE...');
      return requestWithRetry(method, endpoint, data, true);
    }
    // Refresh token is missing/invalid — the session is unrecoverable, so
    // log the user out locally rather than leaving them stuck on a screen
    // that will keep failing every request with no way forward.
    useAuthStore.getState().clearUser();
  }

  if (!res.ok) {
    let errorMsg = 'API Request Failed';
    try {
      const errJson = await res.json();
      if (errJson?.message) errorMsg = errJson.message;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return res.json();
};

/**
 * For endpoints that don't return JSON (e.g. CSV/file exports). `get`/`post`
 * etc. always call res.json() — pointed at a CSV response, that throws
 * immediately, which is why the finance export screen has always failed.
 */
const getRawText = async (endpoint: string): Promise<string> => {
  const headers = await getHeaders();
  const res = await fetch(`${apiBase}/api/v1${endpoint}`, { method: 'GET', headers });
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.text();
};

/**
 * Uploads a local file (image-picker URI) as multipart/form-data to the
 * backend's generic media endpoint — replaces the direct
 * supabase.storage.from(bucket).upload(...) calls scattered across
 * chat.tsx/chef-register.tsx/profile.tsx/menu.tsx/dashboard.tsx. No
 * Content-Type header is set here deliberately: fetch/FormData needs to set
 * its own multipart boundary, which a fixed 'application/json' header (what
 * getHeaders() always returns) would break.
 */
const uploadFile = async (bucket: string, folder: string, fileUri: string): Promise<{ url: string }> => {
  const token = useAuthStore.getState().token;
  const filename = fileUri.split('/').pop() || `upload_${Date.now()}.jpg`;
  const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'pdf' ? 'application/pdf' : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', { uri: fileUri, name: filename, type: mimeType } as any);

  const res = await fetch(`${apiBase}/api/v1/media/upload?bucket=${encodeURIComponent(bucket)}&folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: {
      'X-Request-Timestamp': Date.now().toString(),
      'X-Request-Nonce': generateNonce(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    let errorMsg = 'Upload failed';
    try {
      const errJson = await res.json();
      if (errJson?.message) errorMsg = errJson.message;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  const body = await res.json();
  return body.data;
};

export const apiClient = {
  get: async (endpoint: string) => requestWithRetry('GET', endpoint),
  post: async (endpoint: string, data: any) => requestWithRetry('POST', endpoint, data),
  put: async (endpoint: string, data?: any) => requestWithRetry('PUT', endpoint, data),
  patch: async (endpoint: string, data?: any) => requestWithRetry('PATCH', endpoint, data),
  delete: async (endpoint: string) => requestWithRetry('DELETE', endpoint),
  getRawText,
  uploadFile,
  deleteFile: (bucket: string, path: string) => requestWithRetry('DELETE', '/media', { bucket, path }),
};

export default apiClient;
