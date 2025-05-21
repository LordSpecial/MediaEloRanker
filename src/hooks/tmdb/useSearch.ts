import { useState, useEffect, useCallback } from 'react';
import { tmdbApiClient } from '../../services/api/tmdb';
import { TMDBMovie, TMDBTVShow, TMDBResponse, TMDBMediaItem } from '../../services/api/tmdb';
import { ApiError } from '../../services/api/errors';
import { isMovie, isTVShow } from '../../services/utils/mediaUtils';

interface UseSearchOptions {
    autoSearch?: boolean;
    mediaType?: 'movie' | 'tv' | 'all';
    debounceMs?: number;
}

export const useSearch = (options: UseSearchOptions = {}) => {
    const { 
        autoSearch = false, 
        mediaType = 'all', 
        debounceMs = 500 
    } = options;
    
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<(TMDBMovie | TMDBTVShow)[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            let searchResults: (TMDBMovie | TMDBTVShow)[] = [];
            
            if (mediaType === 'all' || mediaType === 'movie') {
                const movieResults = await tmdbApiClient.searchMovies(searchQuery);
                if (movieResults) {
                    searchResults = [...searchResults, ...movieResults.results.filter(isMovie)];
                }
            }
            
            if (mediaType === 'all' || mediaType === 'tv') {
                const tvResults = await tmdbApiClient.searchTVShows(searchQuery);
                if (tvResults) {
                    searchResults = [...searchResults, ...tvResults.results.filter(isTVShow)];
                }
            }
            
            setResults(searchResults);
        } catch (err) {
            console.error('Error searching:', err);
            const errorMessage = err instanceof ApiError 
                ? err.message 
                : 'Failed to search media';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [mediaType]);
    
    // Handle auto-search with debounce
    useEffect(() => {
        if (!autoSearch || !query.trim()) {
            setResults([]);
            return;
        }
        
        const debounceTimer = setTimeout(() => {
            performSearch(query);
        }, debounceMs);
        
        return () => clearTimeout(debounceTimer);
    }, [query, autoSearch, debounceMs, performSearch]);
    
    return {
        query,
        setQuery,
        results,
        loading,
        error,
        search: performSearch
    };
};