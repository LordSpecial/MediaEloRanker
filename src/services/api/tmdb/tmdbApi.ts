import { tmdbApiClient } from './tmdbApiClient';

/**
 * @deprecated Use tmdbApiClient from './tmdbApiClient' instead
 * This module is maintained for backward compatibility
 */
export const tmdbApi = {
    // Movie methods
    getMovies: async (category: string, params?: { page?: number }) => {
        console.warn('tmdbApi is deprecated. Use tmdbApiClient instead.');
        return tmdbApiClient.getMovies(category, params);
    },

    // TV Show methods
    getTVShows: async (category: string, params?: { page?: number }) => {
        console.warn('tmdbApi is deprecated. Use tmdbApiClient instead.');
        return tmdbApiClient.getTVShows(category, params);
    },

    // Trending methods
    getTrending: async (mediaType: 'movie' | 'tv', timeWindow: 'day' | 'week' = 'week', page: number = 1) => {
        console.warn('tmdbApi is deprecated. Use tmdbApiClient instead.');
        return tmdbApiClient.getTrending(mediaType, timeWindow, page);
    },

    // Search methods
    searchMovies: async (query: string, page: number = 1) => {
        console.warn('tmdbApi is deprecated. Use tmdbApiClient instead.');
        return tmdbApiClient.searchMovies(query, page);
    },

    searchTVShows: async (query: string, page: number = 1) => {
        console.warn('tmdbApi is deprecated. Use tmdbApiClient instead.');
        return tmdbApiClient.searchTVShows(query, page);
    },

    // Get detailed movie information
    getMovieDetails: async (movieId: string | number) => {
        console.warn('tmdbApi is deprecated. Use tmdbApiClient instead.');
        return tmdbApiClient.getMovieDetails(movieId);
    },

    // Get detailed TV show information
    getTVShowDetails: async (tvId: string | number) => {
        console.warn('tmdbApi is deprecated. Use tmdbApiClient instead.');
        return tmdbApiClient.getTVShowDetails(tvId);
    },

    // Get movie/TV credits
    getCredits: async (mediaType: 'movie' | 'tv', id: string | number) => {
        console.warn('tmdbApi is deprecated. Use tmdbApiClient instead.');
        return tmdbApiClient.getCredits(mediaType, id);
    }
};