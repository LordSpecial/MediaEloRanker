import { useLibraryItems } from './useLibraryItems';
import { useLibraryActions } from './useLibraryActions';
import { SortField } from '@/types/media';

// Re-export the hooks
export { useLibraryItems } from './useLibraryItems';
export { useLibraryActions } from './useLibraryActions';

// Props for the combined hook
interface UseLibraryProps {
    category?: string;
    sortOrder?: SortField;
}

/**
 * Combined hook that merges the functionality of useLibraryItems and useLibraryActions
 * for backward compatibility with the original useLibrary hook
 */
export const useLibrary = (props: UseLibraryProps = {}) => {
    const { mediaItems, loading: itemsLoading, error: itemsError, refetch } = useLibraryItems(props);
    const { 
        loading: actionsLoading, 
        error: actionsError, 
        addToLibrary,
        updateUserRating,
        getUserRating,
        getMediaMetadata,
        updateMediaMetadata,
        checkInLibrary
    } = useLibraryActions();

    // Combine loading and error states
    const loading = itemsLoading || actionsLoading;
    const error = itemsError || actionsError;

    return {
        // From useLibraryItems
        mediaItems,
        refetch,
        
        // From useLibraryActions
        addToLibrary,
        updateUserRating,
        getUserRating,
        getMediaMetadata,
        updateMediaMetadata,
        checkInLibrary,
        
        // Combined states
        loading,
        error
    };
}; 