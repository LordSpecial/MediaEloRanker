import axios from 'axios';
import { tmdbConfig } from '../../config/tmdb.config';
import type { TMDBResponse, TMDBMovie, TMDBTVShow, TMDBCredits } from './types';

const api = axios.create({
    baseURL: tmdbConfig.baseUrl,
    params: {
        api_key: tmdbConfig.apiKey,
    },
});

export const tmdbApi = {
    // Movie methods
    getMovies: async (category: string, params?: { page?: number }) => {
        try {
            const response = await api.get<TMDBResponse<TMDBMovie>>(`/movie/${category}`, {
                params: {
                    ...params,
                    language: 'en-US'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB API Error:', error);
            throw error;
        }
    },

    // TV Show methods
    getTVShows: async (category: string, params?: { page?: number }) => {
        try {
            const response = await api.get<TMDBResponse<TMDBTVShow>>(`/tv/${category}`, {
                params: {
                    ...params,
                    language: 'en-US'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB API Error:', error);
            throw error;
        }
    },

    // Trending methods
    getTrending: async (mediaType: 'movie' | 'tv', timeWindow: 'day' | 'week' = 'week', page: number = 1) => {
        try {
            const response = await api.get<TMDBResponse<TMDBMovie | TMDBTVShow>>(
                `/trending/${mediaType}/${timeWindow}`,
                {
                    params: {
                        page,
                        language: 'en-US'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('TMDB API Error:', error);
            throw error;
        }
    },

    // Search methods
    searchMovies: async (query: string, page: number = 1) => {
        try {
            const response = await api.get<TMDBResponse<TMDBMovie>>('/search/movie', {
                params: {
                    query,
                    page,
                    language: 'en-US'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB API Error:', error);
            throw error;
        }
    },

    searchTVShows: async (query: string, page: number = 1) => {
        try {
            const response = await api.get<TMDBResponse<TMDBTVShow>>('/search/tv', {
                params: {
                    query,
                    page,
                    language: 'en-US'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB API Error:', error);
            throw error;
        }
    },

    // Get detailed movie information
    getMovieDetails: async (movieId: string | number) => {
        try {
            const response = await api.get<TMDBMovie>(`/movie/${movieId}`, {
                params: {
                    language: 'en-US',
                    append_to_response: 'credits,videos'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB API Error:', error);
            throw error;
        }
    },

    // Get detailed TV show information
    getTVShowDetails: async (tvId: string | number) => {
        try {
            const response = await api.get<TMDBTVShow>(`/tv/${tvId}`, {
                params: {
                    language: 'en-US',
                    append_to_response: 'credits,videos'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB API Error:', error);
            throw error;
        }
    },

    // Get movie/TV credits
    getCredits: async (mediaType: 'movie' | 'tv', id: string | number) => {
        try {
            const response = await api.get<TMDBCredits>(`/${mediaType}/${id}/credits`, {
                params: {
                    language: 'en-US'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB API Error:', error);
            throw error;
        }
    }
};