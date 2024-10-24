import { useState, useEffect } from 'react';
import { tmdbApi } from '../../services/api/tmdb/tmdbApi';
import type { TMDBTVShow, TMDBResponse } from '../../services/api/tmdb/types';

type TVCategory = 'popular' | 'top_rated' | 'airing_today' | 'on_the_air';

interface UseTVOptions {
    page?: number;
    timeWindow?: 'day' | 'week';
}

export const useTV = (
    category: TVCategory | 'trending',
    options: UseTVOptions = {}
) => {
    const [data, setData] = useState<TMDBResponse<TMDBTVShow> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTV = async () => {
            try {
                setLoading(true);
                let response;

                if (category === 'trending') {
                    response = await tmdbApi.getTrending('tv', options.timeWindow || 'week');
                } else {
                    response = await tmdbApi.getTVShows(category, { page: options.page });
                }

                setData(response);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchTV();
    }, [category, options.page, options.timeWindow]);

    return {
        shows: data?.results || [],
        loading,
        error,
        hasMore: data ? (options.page || 1) < data.total_pages : false,
        totalResults: data?.total_results || 0,
        currentPage: options.page || 1,
    };
};