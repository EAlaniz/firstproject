import { useEffect, useRef } from 'react';

/**
 * Custom hook to track the previous value of a state or prop
 *
 * This is a modern replacement for using useRef to manually track previous values.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const [count, setCount] = useState(0);
 *   const prevCount = usePrevious(count);
 *
 *   console.log('Current:', count, 'Previous:', prevCount);
 * };
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
