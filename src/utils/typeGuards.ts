/**
 * Type guard utilities for type-safe operations
 */

import { MediaType } from '../types/media/common';
import { TMDBMovie, TMDBTVShow, TMDBMediaItem } from '../types/api/tmdb';

// Type predicates for checking media types by their 'type' property
export function isMovieType(item: { type: MediaType }): boolean {
    return item.type === 'film';
}

export function isTVShowType(item: { type: MediaType }): boolean {
    return item.type === 'tv';
}

export function isAnimeType(item: { type: MediaType }): boolean {
    return item.type === 'anime';
}

export function isMusicType(item: { type: MediaType }): boolean {
    return item.type === 'music';
}

// TMDB API type guards
export function isTMDBMovie(media: TMDBMediaItem): media is TMDBMovie {
    return 'title' in media && 'release_date' in media;
}

export function isTMDBTVShow(media: TMDBMediaItem): media is TMDBTVShow {
    return 'name' in media && 'first_air_date' in media;
}

// Anime detection for TMDB items (based on genre and language)
export function isTMDBAnime(media: TMDBMediaItem): boolean {
    const ANIMATION_GENRE_ID = 16;
    const genres = media.genre_ids || [];
    return genres.includes(ANIMATION_GENRE_ID) && media.original_language === 'ja';
}

// Helper to determine media type from TMDB item
export function determineMediaType(media: TMDBMediaItem): MediaType {
    if (isTMDBAnime(media)) {
        return 'anime';
    }
    return isTMDBMovie(media) ? 'film' : 'tv';
} 