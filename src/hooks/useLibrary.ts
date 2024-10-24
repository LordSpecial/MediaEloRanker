import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { libraryService } from '../services/firebase/libraryService';
import { toast } from '@/components/ui/use-toast';
import { FirebaseError } from 'firebase/app';

export const useLibrary = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addToLibrary = useCallback(async (mediaData: {
        mediaId: string;
        type: 'film' | 'tv' | 'anime' | 'music';
        title: string;
        releaseYear: number;
        imageUrl: string | null;
    }) => {
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
            // Validate all required fields are present
            if (!mediaData.mediaId || !mediaData.type || !mediaData.title || !mediaData.releaseYear) {
                throw new Error('Missing required media data');
            }

            await libraryService.addToLibrary(user.uid, {
                ...mediaData,
                // Ensure all fields are present and properly typed
                mediaId: mediaData.mediaId.toString(),
                type: mediaData.type,
                title: mediaData.title,
                releaseYear: mediaData.releaseYear,
                imageUrl: mediaData.imageUrl
            });

            toast({
                title: "Added to Library",
                description: `${mediaData.title} has been added to your library`,
            });
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Failed to add to library';

            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });

            // Log the error details for debugging
            console.error('Add to library error details:', {
                mediaData,
                error: err
            });
        } finally {
            setLoading(false);
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
        addToLibrary,
        checkInLibrary,
        loading,
        error
    };
};