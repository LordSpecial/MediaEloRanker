/**
 * Music-specific type definitions
 */

import { BaseMediaItem, MediaRating, BaseMediaMetadata } from './common';

export interface MusicMetadata extends BaseMediaMetadata {
    artist: string;
    album: string;
    tracks: number;
    label: string;
}

export interface Music extends BaseMediaItem, MediaRating {
    type: 'music';
    metadata?: MusicMetadata;
} 