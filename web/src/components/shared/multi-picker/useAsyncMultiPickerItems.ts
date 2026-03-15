import { useEffect, useState, type DependencyList } from "react";

interface UseAsyncMultiPickerItemsParams<T> {
  readonly loader: () => Promise<T[]>;
  readonly deps: DependencyList;
  readonly fallbackErrorMessage: string;
}

interface UseAsyncMultiPickerItemsResult<T> {
  readonly items: T[];
  readonly loading: boolean;
  readonly error: string | null;
}

export default function useAsyncMultiPickerItems<T>({
  loader,
  deps,
  fallbackErrorMessage,
}: Readonly<UseAsyncMultiPickerItemsParams<T>>): UseAsyncMultiPickerItemsResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await loader();
        setItems(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : fallbackErrorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
    // Hook caller controls dependency semantics via `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { items, loading, error };
}
