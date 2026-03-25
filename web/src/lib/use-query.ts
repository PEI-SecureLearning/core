import { useState, useEffect, useCallback } from 'react'

export function useQuery<T>({ queryKey, queryFn, enabled = true }: { queryKey: any[], queryFn: () => Promise<T>, enabled?: boolean }) {
    const [data, setData] = useState<T | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(enabled)
    const [isFetching, setIsFetching] = useState(false)
    const [isError, setIsError] = useState(false)
    const [error, setError] = useState<any>(null)

    const fetchData = useCallback(async () => {
        setIsFetching(true)
        try {
            const result = await queryFn()
            setData(result)
            setIsError(false)
        } catch (err) {
            setIsError(true)
            setError(err)
        } finally {
            setIsLoading(false)
            setIsFetching(false)
        }
    }, [queryFn])

    useEffect(() => {
        if (enabled) {
            void fetchData()
        }
    }, [JSON.stringify(queryKey), enabled, fetchData])

    useEffect(() => {
        const handleInvalidate = () => {
            void fetchData()
        }
        window.addEventListener('query-invalidate', handleInvalidate)
        return () => window.removeEventListener('query-invalidate', handleInvalidate)
    }, [fetchData])

    return { data, isLoading, isFetching, isError, error, refetch: fetchData }
}

export function useMutation<T, V>({ mutationFn, onSuccess, onError }: { 
    mutationFn: (variables: V) => Promise<T>, 
    onSuccess?: (data: T) => void,
    onError?: (error: any) => void 
}) {
    const [isPending, setIsPending] = useState(false)

    const mutate = useCallback(async (variables: V) => {
        setIsPending(true)
        try {
            const result = await mutationFn(variables)
            onSuccess?.(result)
            return result
        } catch (err) {
            onError?.(err)
            throw err
        } finally {
            setIsPending(false)
        }
    }, [mutationFn, onSuccess, onError])

    return { mutate, isPending }
}

export function useQueryClient() {
    return {
        invalidateQueries: () => {
            window.dispatchEvent(new CustomEvent('query-invalidate'))
        }
    }
}
