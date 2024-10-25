import { useState, useEffect } from 'react';
import { tmdbApi } from '../../services/api/tmdb/tmdbApi';
import type { TMDBMovie, TMDBResponse } from '../../services/api/tmdb/types';

type MovieCategory = 'popular' | 'top_rated' | 'trending' | 'random';

interface UseMoviesOptions {
    page?: number;
    timeWindow?: 'day' | 'week';
}

export const useMovies = (category: MovieCategory, options: UseMoviesOptions = {}) => {
    const [movies, setMovies] = useState<TMDBMovie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(options.page || 1);


    const fetchMovies = async (pageNum: number, cat: MovieCategory = category) => {
        try {
            setLoading(true);
            setError(null);

            let response: TMDBResponse<TMDBMovie>;

            switch(cat) {
                case 'trending':
                    response = await tmdbApi.getTrending('movie', options.timeWindow || 'week', pageNum);
                    break;
                case 'random':
                    const randomPage = Math.floor(Math.random() * 20) + 1;
                    response = await tmdbApi.getMovies('popular', { page: randomPage });
                    response.results = response.results
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 20);
                    break;
                default:
                    response = await tmdbApi.getMovies(cat, { page: pageNum });
            }

            // Filter to ensure we only have movies
            const movieResults = response.results.filter((item): item is TMDBMovie =>
                'title' in item && 'release_date' in item
            );

            if (pageNum === 1 || cat === 'random') {
                setMovies(movieResults);
            } else {
                setMovies(prev => [...prev, ...movieResults]);
            }

            setTotalPages(response.total_pages);
            setHasMore(pageNum < response.total_pages && cat !== 'random');
        } catch (err) {
            console.error('Error fetching movies:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch movies');
        } finally {
            setLoading(false);
        }
    };

    // Handle initial load and category changes
    useEffect(() => {
        if (category !== 'random') { // Don't automatically fetch random movies
            setCurrentPage(1);
            setMovies([]);
            fetchMovies(1);
        }
    }, [category, options.timeWindow]);

    const loadMore = async () => {
        if (!loading && hasMore) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            await fetchMovies(nextPage);
        }
    };

    const getRandomMovies = async () => {
        setMovies([]); // Clear current movies
        await fetchMovies(1, 'random');
    };

    return {
        movies,
        loading,
        error,
        hasMore,
        loadMore,
        currentPage,
        totalPages,
        getRandomMovies
    };
};