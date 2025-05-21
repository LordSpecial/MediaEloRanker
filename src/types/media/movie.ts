/**
 * Movie-specific type definitions
 */

import { BaseMediaItem, MediaRating, BaseMediaMetadata } from './common';

export interface FilmTVMetadata extends BaseMediaMetadata {
    director: string;
    writers: string[];
    cast: string[];
    duration: string;
}

export interface Movie extends BaseMediaItem, MediaRating {
    type: 'film';
    metadata?: FilmTVMetadata;
} 