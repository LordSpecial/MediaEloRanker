import { useState, useEffect } from 'react';
import { tmdbApi } from '../../services/api/tmdb/tmdbApi';
import type { TMDBTVShow, TMDBResponse } from '../../services/api/tmdb/types';

type TVCategory = 'popular' | 'top_rated' | 'trending' | 'random';

interface UseTVOptions {
    page?: number;
    timeWindow?: 'day' | 'week';
}

export const useTV = (category: TVCategory, options: UseTVOptions = {}) => {
    const [shows, setShows] = useState<TMDBTVShow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(options.page || 1);

    const fetchShows = async (pageNum: number, cat: TVCategory = category) => {
        try {
            setLoading(true);
            setError(null);

            let response: TMDBResponse<TMDBTVShow>;

            switch(cat) {
                case 'trending':
                    response = await tmdbApi.getTrending('tv', options.timeWindow || 'week');
                    break;
                case 'random':
                    const randomPage = Math.floor(Math.random() * 20) + 1;
                    response = await tmdbApi.getTVShows('popular', { page: randomPage });
                    response.results = response.results
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 20);
                    break;
                default:
                    response = await tmdbApi.getTVShows(cat, { page: pageNum });
            }

            if (pageNum === 1 || cat === 'random') {
                setShows(response.results);
            } else {
                setShows(prev => [...prev, ...response.results]);
            }

            setTotalPages(response.total_pages);
            setHasMore(pageNum < response.total_pages && cat !== 'random');
        } catch (err) {
            console.error('Error fetching TV shows:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch TV shows');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (category !== 'random') {
            setCurrentPage(1);
            setShows([]);
            fetchShows(1);
        }
    }, [category, options.timeWindow]);

    const loadMore = async () => {
        if (!loading && hasMore) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            await fetchShows(nextPage);
        }
    };

    const getRandomShows = async () => {
        setShows([]);
        await fetchShows(1, 'random');
    };

    return {
        shows,
        loading,
        error,
        hasMore,
        loadMore,
        currentPage,
        totalPages,
        getRandomShows
    };
};