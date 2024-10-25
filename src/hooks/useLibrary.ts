import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { libraryService, MediaItem } from '../services/firebase/libraryService';
import { toast } from '@/components/ui/use-toast';

export type SortField = 'dateAdded' | 'globalEloScore' | 'categoryEloScore' | 'userRating';

interface UseLibraryProps {
    category?: string;
    sortOrder?: SortField;
}

interface UseLibraryReturn {
    mediaItems: MediaItem[];
    loading: boolean;
    error: string | null;
    addToLibrary: (mediaData: AddToLibraryParams) => Promise<void>;
    checkInLibrary: (mediaId: string) => Promise<boolean>;
    refetch: () => Promise<void>;
}

interface AddToLibraryParams {
    mediaId: string;
    type: 'film' | 'tv' | 'anime' | 'music';
    title: string;
    releaseYear: number;
    imageUrl: string | null;
}

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

            console.log('Fetching library with params:', { category, sortOrder });

            const items = await libraryService.fetchLibraryItems(user.uid, category, sortOrder);
            console.log('Fetched items:', items);

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

    const addToLibrary = useCallback(async (mediaData: AddToLibraryParams) => {
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
            if (!mediaData.mediaId || !mediaData.type || !mediaData.title || !mediaData.releaseYear) {
                throw new Error('Missing required media data');
            }

            await libraryService.addToLibrary(user.uid, {
                ...mediaData,
                mediaId: mediaData.mediaId.toString(),
                type: mediaData.type,
                title: mediaData.title,
                releaseYear: mediaData.releaseYear,
                imageUrl: mediaData.imageUrl
            });

            const validation = await libraryService.validateLibraryItem(user.uid, mediaData.mediaId);
            console.log('Validation after adding:', validation);

            toast({
                title: "Added to Library",
                description: `${mediaData.title} has been added to your library`,
            });

            await fetchLibrary();
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

    useEffect(() => {
        console.log('useEffect triggered with:', { category, sortOrder });
        fetchLibrary();
    }, [user, category, sortOrder]);

    // Make sure to include all functions in the return value
    return {
        mediaItems,
        loading,
        error,
        addToLibrary,
        checkInLibrary,  // This was missing before
        refetch: fetchLibrary
    };
};