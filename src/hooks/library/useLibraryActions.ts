import { useState, useCallback } from 'react';
import { useAuth } from '../useAuth';
import { libraryService } from '../../services/firebase/libraryService';
import { toast } from '@/components/ui/use-toast';
import { tmdbApi } from "../../services/api/tmdb/tmdbApi";
import { convertTMDBToMetadata } from "../../services/utils/mediaTransforms";
import { AddToLibraryParams, MediaMetadata } from '@/types/media';

interface UseLibraryActionsReturn {
    loading: boolean;
    error: string | null;
    addToLibrary: (mediaData: Partial<AddToLibraryParams> & { mediaId: string }) => Promise<void>;
    updateUserRating: (mediaId: string, rating: number) => Promise<void>;
    getUserRating: (mediaId: string) => Promise<number | null>;
    getMediaMetadata: (mediaId: string) => Promise<MediaMetadata | null>;
    updateMediaMetadata: (mediaId: string, metadata: MediaMetadata) => Promise<void>;
    checkInLibrary: (mediaId: string) => Promise<boolean>;
}

// Helper function to validate media data
const validateMediaData = (mediaData: Partial<AddToLibraryParams>) => {
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

export const useLibraryActions = (): UseLibraryActionsReturn => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const addToLibrary = useCallback(async (mediaData: Partial<AddToLibraryParams> & { mediaId: string }) => {
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

            const completeMediaData: AddToLibraryParams = {
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

    const updateMediaMetadata = useCallback(async (mediaId: string, metadata: MediaMetadata) => {
        if (!user) return;

        try {
            await libraryService.updateMediaMetadata(mediaId, metadata);
        } catch (err) {
            console.error('Error updating metadata:', err);
            throw err;
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

    return {
        loading,
        error,
        addToLibrary,
        updateUserRating,
        getUserRating,
        getMediaMetadata,
        updateMediaMetadata,
        checkInLibrary
    };
}; 