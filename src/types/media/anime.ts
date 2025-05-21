/**
 * Anime-specific type definitions
 */

import { BaseMediaItem, MediaRating, BaseMediaMetadata } from './common';

export interface AnimeMetadata extends BaseMediaMetadata {
    studio: string;
    director: string;
    writers: string[];
    cast: string[];
    episodes: number;
}

export interface Anime extends BaseMediaItem, MediaRating {
    type: 'anime';
    metadata?: AnimeMetadata;
} 