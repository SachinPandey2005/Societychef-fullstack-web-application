import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

/** True once Sentry.init() has actually run (i.e. a real DSN was supplied). */
export const isCrashReportingEnabled = Boolean(dsn);

if (dsn) {
  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    // Keep this modest by default; raise once you've confirmed event volume
    // and quota usage on your Sentry plan.
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enabled: !__DEV__, // avoid spamming Sentry with local dev noise
  });
} else if (!__DEV__) {
  // Production build with no DSN configured — make this loud in device logs
  // so it isn't missed, since it means crashes are currently invisible.
  console.warn(
    '[crashReporting] EXPO_PUBLIC_SENTRY_DSN is not set — crash reporting is disabled in this build.'
  );
}

/**
 * Report a caught error (e.g. from ErrorBoundary) to Sentry when configured,
 * always falling back to a console log so nothing is silently swallowed.
 */
export function reportError(error: Error, componentStack?: string) {
  if (dsn) {
    Sentry.captureException(error, {
      contexts: componentStack ? { react: { componentStack } } : undefined,
    });
  } else {
    console.error('[crashReporting] (no DSN configured, not sent to Sentry):', error, componentStack);
  }
}
