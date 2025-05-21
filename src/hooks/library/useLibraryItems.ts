import { useState, useEffect } from 'react';
import { useAuth } from '../useAuth';
import { libraryService } from '../../services/firebase/libraryService';
import { toast } from '@/components/ui/use-toast';
import { MediaItem, SortField } from '@/types/media';

interface UseLibraryItemsProps {
    category?: string;
    sortOrder?: SortField;
}

interface UseLibraryItemsReturn {
    mediaItems: MediaItem[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useLibraryItems = ({
    category = 'all',
    sortOrder = 'dateAdded'
}: UseLibraryItemsProps = {}): UseLibraryItemsReturn => {
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

    useEffect(() => {
        fetchLibrary();
    }, [user, category, sortOrder]);

    return { mediaItems, loading, error, refetch: fetchLibrary };
}; 