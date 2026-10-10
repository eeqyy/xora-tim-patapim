// ============================================================
// XORA — Hook fetch async dengan loading/error/data/retry
// frontend/src/hooks/useAsync.js
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";

export default function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const fnRef = useRef(fn);
  const mountedRef = useRef(true);
  fnRef.current = fn;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fnRef.current();
      if (mountedRef.current) {
        const payload = res && typeof res === "object" && "data" in res ? res.data : res;
        setState({ loading: false, data: payload, error: null });
      }
      return res;
    } catch (err) {
      if (mountedRef.current) setState({ loading: false, data: null, error: err });
      throw err;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    run();
    return () => {
      mountedRef.current = false;
    };
  }, deps);

  return { ...state, run };
}