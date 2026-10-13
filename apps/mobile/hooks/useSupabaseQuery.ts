import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useSupabaseQuery<T>(fetchFn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return { data, loading, error, refetch };
}
