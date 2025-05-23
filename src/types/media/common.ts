/**
 * Common media type definitions used across the application
 */

export type MediaType = 'film' | 'tv' | 'anime' | 'music';

export interface BaseMediaItem {
    id: string;
    title: string;
    releaseYear: number;
    imageUrl: string | null;
    type: MediaType;
}

export interface MediaRating {
    userRating?: number;
    globalEloScore?: number;
    categoryEloScore?: number;
}

export interface MediaItem extends BaseMediaItem, MediaRating {
    mediaId: string;  // External API ID (e.g., TMDB ID)
    addedAt: Date;
    metadata?: MediaMetadata;
}

// Base metadata interface for all media types
export interface BaseMediaMetadata {
    description: string;
    genre: string[];
}

// Forward declaration of specific metadata types that will be imported from other files
// This avoids circular dependencies
export type MediaMetadata = {
    description: string;
    genre: string[];
    [key: string]: any; // Additional properties for specific media types
};

// Sorting options
export type SortField = 'dateAdded' | 'globalEloScore' | 'categoryEloScore' | 'userRating';

// Parameters for adding items to library
export interface AddToLibraryParams {
    mediaId: string;
    type: MediaType;
    title: string;
    releaseYear: number;
    imageUrl: string | null;
    metadata?: MediaMetadata;
    userRating?: number;
} 