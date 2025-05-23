import { useState, useCallback, useEffect } from 'react';

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: (data: T | null, error: Error | null) => void;
  dependencies?: any[];
  immediate?: boolean;
}

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

type UseAsyncReturn<T, P extends any[]> = UseAsyncState<T> & {
  execute: (...params: P) => Promise<T | null>;
  reset: () => void;
};

/**
 * useAsync is a hook for handling asynchronous operations with standardized
 * loading, error, and data states.
 *
 * @param asyncFunction The async function to execute
 * @param options Configuration options for the hook
 * @returns Object containing data, loading, and error states, plus execute and reset functions
 */
export function useAsync<T, P extends any[] = []>(
  asyncFunction: (...params: P) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, P> {
  const {
    onSuccess,
    onError,
    onSettled,
    dependencies = [],
    immediate = false
  } = options;

  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null
  });

  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      setState(prevState => ({ ...prevState, loading: true, error: null }));

      try {
        const data = await asyncFunction(...params);
        setState({ data, loading: false, error: null });

        if (onSuccess) {
          onSuccess(data);
        }
        if (onSettled) {
          onSettled(data, null);
        }

        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error });

        if (onError) {
          onError(error);
        }
        if (onSettled) {
          onSettled(null, error);
        }

        return null;
      }
    },
    [asyncFunction, onSuccess, onError, onSettled]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    if (immediate) {
      (execute as Function)();
    }
  }, [immediate, execute, ...dependencies]);

  return { ...state, execute, reset };
} 