import axios from 'axios';
import { tmdbConfig } from '../../config/tmdb.config';
import { ENDPOINTS, TIME_WINDOW } from './endpoints';
import type {
    TMDBResponse,
    TMDBMovie,
    MovieListCategory,
    MovieQueryParams,
    SearchQueryParams,
    TMDBError,
    TMDBTVShow
} from './types';

const api = axios.create({
    baseURL: tmdbConfig.baseUrl,
    params: {
        api_key: tmdbConfig.apiKey,
    },
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const tmdbError = error.response?.data as TMDBError;
        throw new Error(tmdbError?.status_message || 'An error occurred');
    }
);

export const tmdbApi = {
    getMovies: async (category: MovieListCategory, params?: MovieQueryParams) => {
        const response = await api.get<TMDBResponse<TMDBMovie>>(ENDPOINTS.MOVIE[category], { params });
        return response.data;
    },

    searchMovies: async (params: SearchQueryParams) => {
        const response = await api.get<TMDBResponse<TMDBMovie>>('/search/movie', { params });
        return response.data;
    },

    getMovieDetails: async (movieId: number) => {
        const response = await api.get<TMDBMovie>(`/movie/${movieId}`);
        return response.data;
    },

    getTVShows: async (category: 'popular' | 'top_rated' | 'airing_today' | 'on_the_air', params?: MovieQueryParams) => {
        const response = await api.get<TMDBResponse<TMDBTVShow>>(`/tv/${category}`, { params });
        return response.data;
    },

    getSimilarMovies: async (movieId: number, params?: MovieQueryParams) => {
        const response = await api.get<TMDBResponse<TMDBMovie>>(`/movie/${movieId}/similar`, { params });
        return response.data;
    },
    get: async <T>(endpoint: string, params?: Record<string, any>) => {
        const response = await api.get<T>(endpoint, { params });
        return response;
    },

    getTrending: async (mediaType: 'all' | 'movie' | 'tv' | 'person', timeWindow: 'day' | 'week' = 'week') => {
        const response = await api.get<TMDBResponse<TMDBTVShow | TMDBMovie>>(
            `/trending/${mediaType}/${timeWindow}`
        );
        return response.data;
    },

    getGenres: async (mediaType: 'movie' | 'tv') => {
        const response = await api.get<{ genres: Array<{ id: number; name: string; }> }>(`/genre/${mediaType}/list`);
        return response.data;
    },

    discover: async (mediaType: 'movie' | 'tv', params?: Record<string, any>) => {
        const response = await api.get<TMDBResponse<TMDBMovie>>(`/discover/${mediaType}`, { params });
        return response.data;
    },

    // Add type guard for error responses
    isErrorResponse: (error: any): error is TMDBError => {
        return error && typeof error.status_code === 'number' && typeof error.status_message === 'string';
    }
};