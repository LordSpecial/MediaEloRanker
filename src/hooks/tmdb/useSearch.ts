import { useState, useEffect, useCallback } from 'react';
import { tmdbApi } from '../../services/api/tmdb/tmdbApi';
import type {TMDBMovie, TMDBResponse, TMDBTVShow} from '../../services/api/tmdb/types';

interface UseSearchOptions {
    initialQuery?: string;
    autoSearch?: boolean;
    debounceMs?: number;
    mediaType?: 'movie' | 'tv';
}

export const useSearch = ({
                              initialQuery = '',
                              autoSearch = true,
                              debounceMs = 300,
                              mediaType = 'movie'
                          }: UseSearchOptions = {}) => {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<TMDBMovie[] | TMDBTVShow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const debouncedSearch = useCallback(
        (() => {
            let timeoutId: NodeJS.Timeout;

            return async (searchQuery: string) => {
                clearTimeout(timeoutId);

                return new Promise<void>((resolve) => {
                    timeoutId = setTimeout(async () => {
                        if (!searchQuery.trim()) {
                            setResults([]);
                            resolve();
                            return;
                        }

                        try {
                            setLoading(true);
                            setError(null);

                            const response = mediaType === 'tv'
                                ? await tmdbApi.searchTVShows(searchQuery)
                                : await tmdbApi.searchMovies(searchQuery);

                            setResults(response.results);
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
        [mediaType, debounceMs]
    );

    useEffect(() => {
        if (autoSearch && query) {
            debouncedSearch(query);
        }
    }, [query, autoSearch, debouncedSearch]);

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
    };
};

export default useSearch;