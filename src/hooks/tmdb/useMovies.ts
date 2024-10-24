import { useState, useEffect } from 'react';
import { tmdbApi } from '../../services/api/tmdb/tmdbApi';
import type { TMDBMovie, MovieListCategory, TMDBResponse } from '../../services/api/tmdb/types';

interface UseMoviesOptions {
    page?: number;
    timeWindow?: 'day' | 'week';
}

export const useMovies = (
    category: MovieListCategory | 'trending',
    options: UseMoviesOptions = {}
) => {
    const [data, setData] = useState<TMDBResponse<TMDBMovie> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoading(true);
                let response;

                if (category === 'trending') {
                    response = await tmdbApi.getTrending('movie', options.timeWindow || 'week');
                } else {
                    response = await tmdbApi.getMovies(category, { page: options.page });
                }

                setData(response);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, [category, options.page, options.timeWindow]);

    return {
        movies: data?.results || [],
        loading,
        error,
        hasMore: data ? (options.page || 1) < data.total_pages : false,
        totalResults: data?.total_results || 0,
        currentPage: options.page || 1,
    };
};