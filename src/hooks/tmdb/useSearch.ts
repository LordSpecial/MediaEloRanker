import { useState, useEffect, useCallback } from 'react';
import { tmdbApi } from '../../services/api/tmdb/tmdbApi';
import type { TMDBMovie, SearchQueryParams, TMDBResponse } from '../../services/api/tmdb/types';

interface UseSearchOptions {
    initialQuery?: string;
    autoSearch?: boolean;
    debounceMs?: number;
}

export const useSearch = ({
                              initialQuery = '',
                              autoSearch = true,
                              debounceMs = 300
                          }: UseSearchOptions = {}) => {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<TMDBMovie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // Debounced search function
    const debouncedSearch = useCallback(
        (() => {
            let timeoutId: NodeJS.Timeout;

            return (searchQuery: string) => {
                clearTimeout(timeoutId);

                return new Promise<void>((resolve) => {
                    timeoutId = setTimeout(async () => {
                        if (!searchQuery.trim()) {
                            setResults([]);
                            setTotalPages(0);
                            resolve();
                            return;
                        }

                        try {
                            setLoading(true);
                            setError(null);

                            const response = await tmdbApi.searchMovies({
                                query: searchQuery,
                                page: 1
                            });

                            setResults(response.results);
                            setTotalPages(response.total_pages);
                            setPage(1);
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'Search failed');
                            setResults([]);
                        } finally {
                            setLoading(false);
                            resolve();
                        }
                    }, debounceMs);
                });
            };
        })(),
        [debounceMs]
    );

    // Load more results
    const loadMore = async () => {
        if (loading || !query || page >= totalPages) return;

        try {
            setLoading(true);
            const response = await tmdbApi.searchMovies({
                query,
                page: page + 1
            });

            setResults(prev => [...prev, ...response.results]);
            setPage(prev => prev + 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load more results');
        } finally {
            setLoading(false);
        }
    };

    // Auto-search effect
    useEffect(() => {
        if (autoSearch && query) {
            debouncedSearch(query);
        }
    }, [query, autoSearch, debouncedSearch]);

    // Manual search function
    const search = async (searchQuery: string) => {
        setQuery(searchQuery);
        if (!autoSearch) {
            await debouncedSearch(searchQuery);
        }
    };

    return {
        query,
        results,
        loading,
        error,
        setQuery,
        search,
        loadMore,
        hasMore: page < totalPages,
        totalResults: results.length,
        totalPages,
    };
};

export default useSearch;