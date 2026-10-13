import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional hook to report the error to a monitoring service (e.g. Sentry). */
  onError?: (error: Error, componentStack: string) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort crash guard for the app's render tree.
 *
 * Without this, an unhandled render error in any single screen crashes the
 * whole app (a blank/red screen with no way back for the user). This catches
 * it, reports it if a reporter is wired up, and offers a manual recovery
 * action instead of a hard crash.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, info?.componentStack);
    this.props.onError?.(error, info?.componentStack || '');
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            An unexpected error occurred. You can try again, or restart the app if the problem
            continues.
          </Text>
          <Pressable style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f3f1ea',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#17211c',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#66736c',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#17211c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
