import { tmdbApiClient } from '../../services/api/tmdb/tmdbApiClient';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TMDBTVShow, TMDBMediaItem } from '@/types/api/tmdb';
import { TMDBResponse } from '@/types/api';
import { ApiError } from '../../services/api/errors';
import { isTVShow } from "../../services/utils/mediaUtils";
import { isAnime } from "../../services/utils/mediaTypeGuards";

export type TVCategory = 'popular' | 'top_rated' | 'on_the_air' | 'airing_today' | 'trending' | 'random';

interface UseTVOptions {
    page?: number;
    timeWindow?: 'day' | 'week';
}

export const useTV = (category: TVCategory = 'popular', initialPage: number = 1) => {
    const [shows, setShows] = useState<TMDBTVShow[]>([]);
    const [page, setPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isInitialMount = useRef(true);
    const prevCategory = useRef(category);

    const fetchTVShows = useCallback(async (currentPage = page, replace = true) => {
        try {
            setLoading(true);
            setError(null);
            
            let result: TMDBResponse<TMDBTVShow | TMDBMediaItem>;
            
            if (category === 'trending') {
                result = await tmdbApiClient.getTrending('tv', 'week', currentPage);
            } else if (category === 'random') {
                // For random, we'll fetch popular shows and then shuffle them
                result = await tmdbApiClient.getTVShows('popular', { page: Math.floor(Math.random() * 5) + 1 });
            } else {
                result = await tmdbApiClient.getTVShows(category, { page: currentPage });
            }
            
            const filteredResults = result.results.filter(isTVShow);
            
            setShows(prev => replace ? filteredResults : [...prev, ...filteredResults]);
            setTotalPages(result.total_pages);
            setPage(currentPage);
        } catch (err) {
            console.error('Error fetching TV shows:', err);
            const errorMessage = err instanceof ApiError 
                ? err.message 
                : 'Failed to load TV shows';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [category, page]);

    // Initial fetch
    useEffect(() => {
        // Only replace items when category changes, not when page changes
        const categoryChanged = prevCategory.current !== category;
        const shouldReplace = isInitialMount.current || categoryChanged;
        
        if (shouldReplace) {
            // Reset to page 1 when category changes
            fetchTVShows(initialPage, true);
            prevCategory.current = category;
        }
        
        if (isInitialMount.current) {
            isInitialMount.current = false;
        }
    }, [category, initialPage, fetchTVShows]);

    // Additional methods needed by TVExplorePage
    const loadMore = useCallback(() => {
        if (page < totalPages && !loading) {
            fetchTVShows(page + 1, false);
        }
    }, [fetchTVShows, page, totalPages, loading]);

    const getRandomShows = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get a random page between 1 and 20
            const randomPage = Math.floor(Math.random() * 20) + 1;
            const result = await tmdbApiClient.getTVShows('popular', { page: randomPage });
            
            // Shuffle the results
            const shuffledResults = [...result.results]
                .sort(() => Math.random() - 0.5)
                .filter(isTVShow);
            
            setShows(shuffledResults);
            setTotalPages(result.total_pages);
            setPage(randomPage);
        } catch (err) {
            console.error('Error fetching random TV shows:', err);
            const errorMessage = err instanceof ApiError 
                ? err.message 
                : 'Failed to load random TV shows';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        shows,
        loading,
        error,
        hasMore: page < totalPages,
        loadMore,
        getRandomShows
    };
};