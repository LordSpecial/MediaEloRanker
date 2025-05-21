export type SortField = 'dateAdded' | 'globalEloScore' | 'categoryEloScore' | 'userRating';

// Extended interfaces for different media types
export interface BaseMediaMetadata {
    description: string;
    genre: string[];
}

export interface FilmTVMetadata extends BaseMediaMetadata {
    director: string;
    writers: string[];
    cast: string[];
    duration: string;
}

export interface AnimeMetadata extends BaseMediaMetadata {
    studio: string;
    director: string;
    writers: string[];
    cast: string[];
    episodes: number;
}

export interface MusicMetadata extends BaseMediaMetadata {
    artist: string;
    album: string;
    tracks: number;
    label: string;
}

export type MediaMetadata = FilmTVMetadata | AnimeMetadata | MusicMetadata;

export interface MediaItem {
    id: number;
    mediaId: string;
    type: 'film' | 'tv' | 'anime' | 'music';
    title: string;
    imageUrl: string | null;
    releaseYear: number;
    userRating: number | null;
    globalEloScore: number;
    categoryEloScore: number;
    addedAt: Date;
    metadata?: MediaMetadata;
}

// Parameters for adding items to library
export interface AddToLibraryParams {
    mediaId: string;
    type: 'film' | 'tv' | 'anime' | 'music';
    title: string;
    releaseYear: number;
    imageUrl: string | null;
    metadata?: MediaMetadata;
    userRating?: number;
} 