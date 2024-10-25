import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { libraryService, MediaItem, AddToLibraryParams } from '../services/firebase/libraryService';
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
    addToLibrary: (mediaData: Partial<AddToLibraryParams> & { mediaId: string }) => Promise<void>;
    checkInLibrary: (mediaId: string) => Promise<boolean>;
    refetch: () => Promise<void>;
}

// Helper function to determine media type
const determineMediaType = (mediaData: Partial<AddToLibraryParams>): 'film' | 'tv' | 'anime' | 'music' => {
    // If type is already specified, use it
    if (mediaData.type) {
        return mediaData.type;
    }

    // Otherwise, assume it's a film (since we're dealing with TMDB data)
    // You might want to adjust this logic based on your needs
    return 'film';
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
            // Log the incoming data for debugging
            console.log('Adding to library with data:', mediaData);

            // Validate required fields
            if (!mediaData.mediaId || !mediaData.title || !mediaData.releaseYear) {
                console.error('Invalid media data:', mediaData);
                throw new Error('Missing required media data. Please ensure all required fields are provided.');
            }

            // Determine the media type
            const type = determineMediaType(mediaData);

            // Create complete media data object
            const completeMediaData: AddToLibraryParams = {
                mediaId: mediaData.mediaId.toString(),
                type,
                title: mediaData.title,
                releaseYear: mediaData.releaseYear,
                imageUrl: mediaData.imageUrl || null
            };

            console.log('Processed media data:', completeMediaData);

            await libraryService.addToLibrary(user.uid, completeMediaData);

            toast({
                title: "Added to Library",
                description: `${mediaData.title} has been added to your library`,
            });

            await fetchLibrary();
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Failed to add to library';

            console.error('Add to library error details:', {
                mediaData,
                error: err
            });

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

    return {
        mediaItems,
        loading,
        error,
        addToLibrary,
        checkInLibrary,
        refetch: fetchLibrary
    };
};