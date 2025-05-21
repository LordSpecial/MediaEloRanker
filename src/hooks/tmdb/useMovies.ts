import { tmdbApiClient } from '../../services/api/tmdb';
import { useState, useEffect, useCallback } from 'react';
import { TMDBMovie, TMDBResponse, TMDBMediaItem } from '../../services/api/tmdb';
import { ApiError } from '../../services/api/errors';
import { isMovie } from '../../services/utils/mediaUtils';

export type MovieCategory = 'popular' | 'top_rated' | 'upcoming' | 'now_playing' | 'trending' | 'random';

export const useMovies = (category: MovieCategory = 'popular', initialPage: number = 1) => {
    const [movies, setMovies] = useState<TMDBMovie[]>([]);
    const [page, setPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMovies = useCallback(async (currentPage = page, replace = true) => {
        try {
            setLoading(true);
            setError(null);
            
            let result: TMDBResponse<TMDBMovie | TMDBMediaItem>;
            
            if (category === 'trending') {
                result = await tmdbApiClient.getTrending('movie', 'week', currentPage);
            } else if (category === 'random') {
                // For random, we'll fetch popular movies and then shuffle them
                result = await tmdbApiClient.getMovies('popular', { page: Math.floor(Math.random() * 5) + 1 });
            } else {
                result = await tmdbApiClient.getMovies(category, { page: currentPage });
            }
            
            const filteredResults = result.results.filter(isMovie);
            
            setMovies(prev => replace ? filteredResults : [...prev, ...filteredResults]);
            setTotalPages(result.total_pages);
            setPage(currentPage);
        } catch (err) {
            console.error('Error fetching movies:', err);
            const errorMessage = err instanceof ApiError 
                ? err.message 
                : 'Failed to load movies';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [category, page]);

    // Initial fetch
    useEffect(() => {
        fetchMovies(initialPage, true);
    }, [category, initialPage, fetchMovies]);

    // Additional methods needed by MovieExplorePage
    const loadMore = useCallback(() => {
        if (page < totalPages && !loading) {
            fetchMovies(page + 1, false);
        }
    }, [fetchMovies, page, totalPages, loading]);

    const getRandomMovies = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get a random page between 1 and 20
            const randomPage = Math.floor(Math.random() * 20) + 1;
            const result = await tmdbApiClient.getMovies('popular', { page: randomPage });
            
            // Shuffle the results
            const shuffledResults = [...result.results]
                .sort(() => Math.random() - 0.5)
                .filter(isMovie);
            
            setMovies(shuffledResults);
            setTotalPages(result.total_pages);
            setPage(randomPage);
        } catch (err) {
            console.error('Error fetching random movies:', err);
            const errorMessage = err instanceof ApiError 
                ? err.message 
                : 'Failed to load random movies';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        movies,
        loading,
        error,
        hasMore: page < totalPages,
        loadMore,
        getRandomMovies
    };
};