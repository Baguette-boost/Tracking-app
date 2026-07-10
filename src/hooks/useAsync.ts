// 비동기 데이터 로딩 훅 — data / loading / error / refetch 제공.
// 화면이 api.* 호출 결과를 일관되게 다루도록.

import { useCallback, useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = []
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // fn 은 deps 로 식별 — eslint exhaustive-deps 의도적 무시
  const callback = useCallback(fn, deps);

  // 수동 재조회 — Promise 반환(당겨서 새로고침 완료 시점을 알 수 있게).
  const run = useCallback((): Promise<void> => {
    setLoading(true);
    setError(null);
    return callback()
      .then((res) => setData(res))
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false));
  }, [callback]);

  // 최초/deps 변경 시 로드 (언마운트 시 취소).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    callback()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [callback]);

  return { data, loading, error, refetch: run };
}
