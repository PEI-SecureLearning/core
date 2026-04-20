import { useEffect, useState } from 'react'

/**
 * Returns a debounced copy of `value` that only updates after
 * `delay` ms have elapsed with no new changes.
 */
export function useDebounce<T>(value: T, delay = 400): T {
    const [debounced, setDebounced] = useState<T>(value)

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(id)
    }, [value, delay])

    return debounced
}
