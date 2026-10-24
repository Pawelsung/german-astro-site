import { useCallback, useEffect, useRef, useState } from 'react';
import { writeJSON } from '../lib/progressStorage';

// Writes happen at the user action, before navigation. Incoming sync only reads.
export function useStoredProgress(key, load) {
  const [value, setValue] = useState(load);
  const current = useRef(value);
  const update = useCallback(next => {
    const resolved = typeof next === 'function' ? next(current.current) : next;
    current.current = resolved;
    setValue(resolved);
    writeJSON(key, resolved);
  }, [key]);
  useEffect(() => {
    const refresh = () => {
      const next = load();
      if (JSON.stringify(next) !== JSON.stringify(current.current)) {
        current.current = next;
        setValue(next);
      }
    };
    window.addEventListener('storage', refresh);
    window.addEventListener('learning-progress-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('learning-progress-updated', refresh);
    };
  }, [key, load]);
  return [value, update];
}
