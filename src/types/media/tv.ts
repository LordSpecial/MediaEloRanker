/**
 * TV show-specific type definitions
 */

import { BaseMediaItem, MediaRating } from './common';
import { FilmTVMetadata } from './movie';

export interface TVShow extends BaseMediaItem, MediaRating {
    type: 'tv';
    metadata?: FilmTVMetadata;
    seasons?: number;
    episodes?: number;
} 