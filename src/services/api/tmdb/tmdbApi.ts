import axios from 'axios';
import { tmdbConfig } from '../../config/tmdb.config';
import type { TMDBResponse, TMDBMovie } from './types';

const api = axios.create({
    baseURL: tmdbConfig.baseUrl,
    params: {
        api_key: tmdbConfig.apiKey,
    },
});

export const tmdbApi = {
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

    getTrending: async (mediaType: 'movie' | 'tv', timeWindow: 'day' | 'week' = 'week') => {
        try {
            const response = await api.get<TMDBResponse<TMDBMovie>>(
                `/trending/${mediaType}/${timeWindow}`
            );
            return response.data;
        } catch (error) {
            console.error('TMDB API Error:', error);
            throw error;
        }
    },

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
    }
};