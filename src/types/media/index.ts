/**
 * Export all media types
 */

export * from './common';
export * from './movie';
export * from './tv';
export * from './anime';
export * from './music';

// Re-export specific combined types for convenience
import { Movie } from './movie';
import { TVShow } from './tv';
import { Anime } from './anime';
import { Music } from './music';

export type AnyMedia = Movie | TVShow | Anime | Music; 