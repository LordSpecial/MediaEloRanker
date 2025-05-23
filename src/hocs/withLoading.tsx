import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export interface WithLoadingProps {
  loading: boolean;
  loadingText?: string;
}

/**
 * withLoading is a Higher-Order Component that adds loading state handling to any component.
 * It displays a loading spinner when the loading prop is true, and renders the wrapped component otherwise.
 * 
 * @param WrappedComponent - The component to wrap with loading functionality
 * @param LoadingComponent - Optional custom loading component
 * @returns A new component with loading functionality
 */
export function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  LoadingComponent: React.ComponentType<{ text?: string }> = ({ text }) => <LoadingSpinner text={text} />
) {
  return function WithLoadingComponent({
    loading,
    loadingText,
    ...props
  }: P & WithLoadingProps) {
    if (loading) {
      return <LoadingComponent text={loadingText} />;
    }

    return <WrappedComponent {...(props as P)} />;
  };
} 