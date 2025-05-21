import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSpinner } from './LoadingSpinner';

interface AsyncBoundaryProps {
  children: ReactNode;
  loading?: boolean;
  error?: Error | null;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  onReset?: () => void;
  loadingText?: string;
}

/**
 * AsyncBoundary combines loading and error handling into a single component.
 * It displays a loading indicator when loading, an error UI when there's an error,
 * and the children when neither loading nor error states are present.
 */
export const AsyncBoundary: React.FC<AsyncBoundaryProps> = ({
  children,
  loading = false,
  error = null,
  loadingFallback,
  errorFallback,
  onReset,
  loadingText,
}) => {
  // Handle loading state
  if (loading) {
    return (
      loadingFallback || <LoadingSpinner text={loadingText} className="py-8" />
    );
  }

  // Handle explicit error from props
  if (error) {
    const resetError = () => {
      if (onReset) onReset();
    };

    if (errorFallback) {
      if (typeof errorFallback === 'function') {
        return <>{errorFallback(error, resetError)}</>;
      }
      return <>{errorFallback}</>;
    }

    // Use the error boundary's default fallback
    return (
      <ErrorBoundary
        fallback={null}
        onReset={onReset}
      >
        {/* This will trigger the error boundary */}
        {(() => {
          throw error;
        })()}
      </ErrorBoundary>
    );
  }

  // When not loading and no explicit error, use error boundary for unexpected errors
  return (
    <ErrorBoundary
      fallback={
        typeof errorFallback === 'function'
          ? errorFallback(new Error('An unexpected error occurred'), () => onReset?.())
          : errorFallback
      }
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
}; 