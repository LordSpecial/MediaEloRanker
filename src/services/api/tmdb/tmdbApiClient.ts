import { BaseApiClient } from '../baseApiClient';
import { tmdbConfig, getImageUrl } from '../../config/tmdb.config';
import type { TMDBResponse, TMDBMovie, TMDBTVShow, TMDBCredits, TMDBMediaItem } from './types';
import { ResourceNotFoundError } from '../errors';

export class TMDBApiClient extends BaseApiClient {
    constructor() {
        super(tmdbConfig.baseUrl, {
            api_key: tmdbConfig.apiKey,
            language: 'en-US'
        });
    }

    // Movie methods
    async getMovies(category: string, params?: { page?: number }): Promise<TMDBResponse<TMDBMovie>> {
        try {
            return await this.get<TMDBResponse<TMDBMovie>>(`/movie/${category}`, { params });
        } catch (error) {
            if (error instanceof ResourceNotFoundError) {
                throw new ResourceNotFoundError(`Movie category '${category}'`);
            }
            throw error;
        }
    }

    // TV Show methods
    async getTVShows(category: string, params?: { page?: number }): Promise<TMDBResponse<TMDBTVShow>> {
        try {
            return await this.get<TMDBResponse<TMDBTVShow>>(`/tv/${category}`, { params });
        } catch (error) {
            if (error instanceof ResourceNotFoundError) {
                throw new ResourceNotFoundError(`TV show category '${category}'`);
            }
            throw error;
        }
    }

    // Trending methods
    async getTrending(
        mediaType: 'movie' | 'tv', 
        timeWindow: 'day' | 'week' = 'week', 
        page: number = 1
    ): Promise<TMDBResponse<TMDBMediaItem>> {
        return this.get<TMDBResponse<TMDBMediaItem>>(`/trending/${mediaType}/${timeWindow}`, {
            params: { page }
        });
    }

    // Search methods
    async searchMovies(query: string, page: number = 1): Promise<TMDBResponse<TMDBMovie>> {
        return this.get<TMDBResponse<TMDBMovie>>('/search/movie', {
            params: { query, page }
        });
    }

    async searchTVShows(query: string, page: number = 1): Promise<TMDBResponse<TMDBTVShow>> {
        return this.get<TMDBResponse<TMDBTVShow>>('/search/tv', {
            params: { query, page }
        });
    }

    // Get detailed movie information
    async getMovieDetails(movieId: string | number): Promise<TMDBMovie> {
        try {
            return await this.get<TMDBMovie>(`/movie/${movieId}`, {
                params: {
                    append_to_response: 'credits,videos'
                }
            });
        } catch (error) {
            if (error instanceof ResourceNotFoundError) {
                throw new ResourceNotFoundError(`Movie with ID ${movieId}`);
            }
            throw error;
        }
    }

    // Get detailed TV show information
    async getTVShowDetails(tvId: string | number): Promise<TMDBTVShow> {
        try {
            return await this.get<TMDBTVShow>(`/tv/${tvId}`, {
                params: {
                    append_to_response: 'credits,videos'
                }
            });
        } catch (error) {
            if (error instanceof ResourceNotFoundError) {
                throw new ResourceNotFoundError(`TV show with ID ${tvId}`);
            }
            throw error;
        }
    }

    // Get movie/TV credits
    async getCredits(mediaType: 'movie' | 'tv', id: string | number): Promise<TMDBCredits> {
        try {
            return await this.get<TMDBCredits>(`/${mediaType}/${id}/credits`);
        } catch (error) {
            if (error instanceof ResourceNotFoundError) {
                throw new ResourceNotFoundError(`Credits for ${mediaType} with ID ${id}`);
            }
            throw error;
        }
    }

    // Get image URL
    getImageUrl(path: string | null, size = tmdbConfig.posterSize): string | null {
        return getImageUrl(path, size);
    }
}

// Create a singleton instance
export const tmdbApiClient = new TMDBApiClient(); 