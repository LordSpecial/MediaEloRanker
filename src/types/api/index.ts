/**
 * Export all API types
 */

export * from './tmdb';
export * from './responses';

// Specific TMDB response type
export interface TMDBResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
} 