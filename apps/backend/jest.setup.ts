// Silence logger during tests to avoid console clutter
jest.mock('./src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

// Mock expo-server-sdk
jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn().mockImplementation(() => ({
    sendPushNotificationsAsync: jest.fn(),
    chunkPushNotifications: jest.fn(),
  })),
}));

// Mock Supabase globally
jest.mock('@supabase/supabase-js', () => require('./tests/mocks/supabaseClient'));

// Mock Sentry globally to prevent teardown RangeError maximum call stack size exceeded in jest-util
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  Handlers: {
    requestHandler: () => (_req: any, _res: any, next: any) => next(),
    errorHandler: () => (err: any, _req: any, _res: any, next: any) => next(err),
  },
  setupExpressErrorHandler: jest.fn(),
}));
jest.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: jest.fn(),
}));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.SUPABASE_URL = 'http://localhost:8000';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.RAZORPAY_KEY_ID = 'test-key';
process.env.RAZORPAY_KEY_SECRET = 'test-key';
process.env.CASHFREE_APP_ID = 'test_cf_app_id';
process.env.CASHFREE_SECRET_KEY = 'mock_cf_secret_key_12345';
process.env.CASHFREE_ENV = 'SANDBOX';
process.env.CASHFREE_RETURN_URL = 'rasohi://payment-return?order_id={order_id}';
process.env.CASHFREE_WEBHOOK_URL = 'http://localhost:5000/api/v1/payments/cashfree/webhook';

// Some tests spy on or auto-mock a Drizzle repository, which still requires
// the real module (and therefore db/client.ts's pg Pool) once to read its
// shape before replacing it — closing it here avoids an open-handle warning
// at teardown. Safe even for test files that never touched the DB: a pool
// with no acquired connections closes immediately.
afterAll(async () => {
  try {
    const { pool } = require('./src/db/client');
    await pool.end();
  } catch {
    // DATABASE_URL may be unset for some test files, or the pool may
    // already be closed — either way, nothing to do.
  }
});

