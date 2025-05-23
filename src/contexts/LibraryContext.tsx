import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLibraryItems } from '../hooks/library/useLibraryItems';
import { useLibraryActions } from '../hooks/library/useLibraryActions';
import { AddToLibraryParams, MediaItem, MediaMetadata, SortField } from '@/types/media/common';

// Define the context value type
interface LibraryContextType {
    mediaItems: MediaItem[];
    loading: boolean;
    error: string | null;
    category: string;
    setCategory: (category: string) => void;
    sortOrder: SortField;
    setSortOrder: (sortOrder: SortField) => void;
    addToLibrary: (mediaData: Partial<AddToLibraryParams> & { mediaId: string }) => Promise<void>;
    updateUserRating: (mediaId: string, rating: number) => Promise<void>;
    getUserRating: (mediaId: string) => Promise<number | null>;
    getMediaMetadata: (mediaId: string) => Promise<MediaMetadata | null>;
    updateMediaMetadata: (mediaId: string, metadata: MediaMetadata) => Promise<void>;
    checkInLibrary: (mediaId: string) => Promise<boolean>;
    refetch: () => Promise<void>;
}

// Context props
interface LibraryProviderProps {
    children: ReactNode;
    initialCategory?: string;
    initialSortOrder?: SortField;
}

// Create the context
const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

// Provider component
export const LibraryProvider: React.FC<LibraryProviderProps> = ({ 
    children, 
    initialCategory = 'all',
    initialSortOrder = 'dateAdded'
}) => {
    // Manage filter state in the context
    const [category, setCategory] = useState<string>(initialCategory);
    const [sortOrder, setSortOrder] = useState<SortField>(initialSortOrder);
    
    // Use the hooks with the current filter state
    const { 
        mediaItems, 
        loading: itemsLoading, 
        error: itemsError, 
        refetch 
    } = useLibraryItems({
        category,
        sortOrder
    });
    
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

    // Provide context value with all the state and functions
    const contextValue = {
        mediaItems,
        loading,
        error,
        category,
        setCategory,
        sortOrder,
        setSortOrder,
        addToLibrary,
        updateUserRating,
        getUserRating,
        getMediaMetadata,
        updateMediaMetadata,
        checkInLibrary,
        refetch
    };

    return (
        <LibraryContext.Provider value={contextValue}>
            {children}
        </LibraryContext.Provider>
    );
};

// Custom hook to use the context
export const useLibraryContext = (): LibraryContextType => {
    const context = useContext(LibraryContext);
    
    if (context === undefined) {
        throw new Error('useLibraryContext must be used within a LibraryProvider');
    }
    
    return context;
}; 