import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { libraryService, MediaItem, AddToLibraryParams } from '../services/firebase/libraryService';
import { toast } from '@/components/ui/use-toast';
import {tmdbApi} from "../services/api/tmdb/tmdbApi.ts";
import {convertTMDBToMetadata} from "../services/utils/mediaTransforms.ts";

export type SortField = 'dateAdded' | 'globalEloScore' | 'categoryEloScore' | 'userRating';

// Extended interfaces for different media types
interface BaseMediaMetadata {
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

// Extended AddToLibraryParams to include metadata and user rating
export interface ExtendedAddToLibraryParams extends AddToLibraryParams {
    metadata?: MediaMetadata;
    userRating?: number;
}

interface UseLibraryProps {
    category?: string;
    sortOrder?: SortField;
}

interface UseLibraryReturn {
    mediaItems: MediaItem[];
    loading: boolean;
    error: string | null;
    addToLibrary: (mediaData: Partial<ExtendedAddToLibraryParams> & { mediaId: string }) => Promise<void>;
    checkInLibrary: (mediaId: string) => Promise<boolean>;
    updateUserRating: (mediaId: string, rating: number) => Promise<void>;
    getUserRating: (mediaId: string) => Promise<number | null>;
    getMediaMetadata: (mediaId: string) => Promise<MediaMetadata | null>;
    refetch: () => Promise<void>;
}

const validateMediaData = (mediaData: Partial<ExtendedAddToLibraryParams>) => {
    if (!mediaData.mediaId || !mediaData.title || !mediaData.releaseYear) {
        throw new Error('Missing required media data. Please ensure all required fields are provided.');
    }

    if (mediaData.userRating !== undefined) {
        if (mediaData.userRating < 0 || mediaData.userRating > 5) {
            throw new Error('User rating must be between 0 and 5.');
        }
    }

    // Type-specific validation
    if (mediaData.metadata) {
        switch (mediaData.type) {
            case 'music':
                if (!('artist' in mediaData.metadata)) {
                    throw new Error('Music metadata must include artist information.');
                }
                break;
            case 'film':
            case 'tv':
                if (!('director' in mediaData.metadata)) {
                    throw new Error('Film/TV metadata must include director information.');
                }
                break;
            case 'anime':
                if (!('studio' in mediaData.metadata)) {
                    throw new Error('Anime metadata must include studio information.');
                }
                break;
        }
    }
};

export const useLibrary = ({
                               category = 'all',
                               sortOrder = 'dateAdded'
                           }: UseLibraryProps = {}): UseLibraryReturn => {
    const { user } = useAuth();
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLibrary = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);
            const items = await libraryService.fetchLibraryItems(user.uid, category, sortOrder);
            setMediaItems(items);
        } catch (err) {
            console.error('Error fetching library:', err);
            setError('Failed to load library items');
            toast({
                title: "Error",
                description: "Failed to load library items",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchMediaMetadata = async (mediaId: string, type: 'film' | 'tv'): Promise<MediaMetadata> => {
        try {
            console.log('Fetching metadata for:', { mediaId, type });

            if (type === 'film') {
                const details = await tmdbApi.getMovieDetails(mediaId);
                const credits = await tmdbApi.getCredits('movie', mediaId);
                console.log('Got movie details:', details);
                return convertTMDBToMetadata(details, credits);
            } else if (type === 'tv') {
                const details = await tmdbApi.getTVShowDetails(mediaId);
                const credits = await tmdbApi.getCredits('tv', mediaId);
                console.log('Got TV details:', details);
                return convertTMDBToMetadata(details, credits);
            }
            throw new Error('Unsupported media type');
        } catch (error) {
            console.error('Error fetching media metadata:', error);
            throw error;
        }
    };

    const addToLibrary = useCallback(async (mediaData: Partial<ExtendedAddToLibraryParams> & { mediaId: string }) => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please login to add items to your library",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            validateMediaData(mediaData);

            const type = mediaData.type || 'film';

            // Fetch metadata if not provided
            let metadata = mediaData.metadata;
            if (!metadata && (type === 'film' || type === 'tv')) {
                metadata = await fetchMediaMetadata(mediaData.mediaId, type);
            }

            const completeMediaData: ExtendedAddToLibraryParams = {
                mediaId: mediaData.mediaId.toString(),
                type,
                title: mediaData.title!,
                releaseYear: mediaData.releaseYear!,
                imageUrl: mediaData.imageUrl || null,
                metadata,
                userRating: mediaData.userRating
            };

            await libraryService.addToLibrary(user.uid, completeMediaData);

            toast({
                title: "Added to Library",
                description: `${mediaData.title} has been added to your library`,
            });

            await fetchLibrary();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add to library';
            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [user]);

    const updateUserRating = useCallback(async (mediaId: string, rating: number) => {
        if (!user) return;

        try {
            if (rating < 0 || rating > 5) {
                throw new Error('Rating must be between 0 and 5');
            }

            await libraryService.updateUserRating(user.uid, mediaId, rating);
            await fetchLibrary();

            toast({
                title: "Rating Updated",
                description: "Your rating has been saved",
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update rating';
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        }
    }, [user]);

    const getUserRating = useCallback(async (mediaId: string): Promise<number | null> => {
        if (!user) return null;

        try {
            return await libraryService.getUserRating(user.uid, mediaId);
        } catch (err) {
            console.error('Error fetching user rating:', err);
            return null;
        }
    }, [user]);

    const getMediaMetadata = useCallback(async (mediaId: string): Promise<MediaMetadata | null> => {
        if (!user) return null;

        try {
            return await libraryService.getMediaMetadata(user.uid, mediaId);
        } catch (err) {
            console.error('Error fetching media metadata:', err);
            return null;
        }
    }, [user]);

    const checkInLibrary = useCallback(async (mediaId: string): Promise<boolean> => {
        if (!user) return false;

        try {
            return await libraryService.isInLibrary(user.uid, mediaId);
        } catch (err) {
            console.error('Error checking library status:', err);
            return false;
        }
    }, [user]);

    useEffect(() => {
        fetchLibrary();
    }, [user, category, sortOrder]);

    return {
        mediaItems,
        loading,
        error,
        addToLibrary,
        checkInLibrary,
        updateUserRating,
        getUserRating,
        getMediaMetadata,
        refetch: fetchLibrary
    };
};