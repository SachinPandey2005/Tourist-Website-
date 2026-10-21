import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiClientError } from '../lib/api/client.js';

export interface UseApiOptions {
  immediate?: boolean;
}

export interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: ApiClientError | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  refetch: () => Promise<T | null>;
  setData: (data: T | null) => void;
}

/**
 * Reusable hook managing asynchronous API requests, loading, error, and success states.
 */
export function useApi<T>(
  asyncFn: (...args: never[]) => Promise<T>,
  options: UseApiOptions = { immediate: true }
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(options.immediate));
  const [error, setError] = useState<ApiClientError | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const fnRef = useRef(asyncFn);
  fnRef.current = asyncFn;

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      try {
        const result = await fnRef.current(...(args as never[]));
        setData(result);
        setIsSuccess(true);
        return result;
      } catch (err: unknown) {
        const clientError =
          err instanceof ApiClientError
            ? err
            : new ApiClientError(
                err instanceof Error ? err.message : 'An unexpected error occurred',
                'UNKNOWN_ERROR'
              );
        setError(clientError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refetch = useCallback(() => execute(), [execute]);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [options.immediate, execute]);

  return {
    data,
    isLoading,
    isError: error !== null,
    isSuccess,
    error,
    execute,
    refetch,
    setData,
  };
}
