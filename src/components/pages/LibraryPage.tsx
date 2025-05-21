import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Filter, SortDesc, Search } from 'lucide-react';
import { useLibraryContext } from '../../contexts/LibraryContext';
import { SortField } from '@/types/media/common';
import { MediaGrid, SearchInput } from '@/components/ui/media';
import { MediaCardProps } from '@/components/ui/media/MediaCard';
import { LibraryItemDetailsDialog } from '@/components/ui/library/LibraryItemDetailsDialog';

interface Category {
    id: string;
    label: string;
}

interface SortOption {
    id: SortField;
    label: string;
}

const categories: Category[] = [
    { id: 'all', label: 'All Items' },
    { id: 'film', label: 'Movies' },
    { id: 'tv', label: 'TV Shows' },
    { id: 'anime', label: 'Anime' },
    { id: 'music', label: 'Music' }
];

const sortOptions: SortOption[] = [
    { id: 'dateAdded', label: 'Date Added' },
    { id: 'globalEloScore', label: 'Global Ranking' },
    { id: 'categoryEloScore', label: 'Category Ranking' },
    { id: 'userRating', label: 'Your Rating' }
];

export const LibraryPage = () => {
    // Use filter state directly from context
    const { 
        mediaItems, 
        loading, 
        error, 
        category, 
        setCategory, 
        sortOrder, 
        setSortOrder,
        refetch
    } = useLibraryContext();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<MediaCardProps | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [localMediaItems, setLocalMediaItems] = useState<MediaCardProps[]>([]);

    // Handler for category change
    const handleCategoryChange = (newCategory: string) => {
        console.log('Changing category to:', newCategory);
        setCategory(newCategory);
    };

    // Handler for sort order change
    const handleSortChange = (newSortOrder: SortField) => {
        console.log('Changing sort order to:', newSortOrder);
        setSortOrder(newSortOrder);
    };
    
    // Filter items by search query
    const filteredItems = searchQuery 
        ? mediaItems.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : mediaItems;
    
    // Convert library items to MediaCardProps format
    const mediaCardItems: MediaCardProps[] = filteredItems.map(item => ({
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        rating: item.userRating?.toString() || 'NR',
        year: item.releaseYear,
        mediaType: item.type,
    }));
    
    // Update local state when parent items change
    React.useEffect(() => {
        setLocalMediaItems(mediaCardItems);
    }, [mediaCardItems]);
    
    const handleCardClick = (item: MediaCardProps) => {
        console.log('Clicked media item:', item);
        setSelectedItem(item);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedItem(null);
    };
    
    // Handle rating updates from the dialog
    const handleRatingUpdate = useCallback((id: string, newRating: number) => {
        console.log('Rating updated:', id, newRating);
        
        // Update the item in our local state to reflect the change immediately
        setLocalMediaItems(prevItems => 
            prevItems.map(item => 
                item.id?.toString() === id
                    ? { ...item, rating: newRating.toString() }
                    : item
            )
        );
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-4xl font-bold text-white">My Library</h1>
                        <span className="text-gray-400">
                            {mediaItems.length} items
                        </span>
                    </div>
                    
                    {/* Search */}
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search your library..."
                        className="mb-2"
                    />

                    {/* Filters */}
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Filter size={20} className="text-gray-400" />
                                    <span className="text-gray-300">Filter by:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((categoryOption) => (
                                        <button
                                            key={categoryOption.id}
                                            onClick={() => handleCategoryChange(categoryOption.id)}
                                            className={`px-4 py-2 rounded-full text-sm transition-colors ${
                                                category === categoryOption.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            {categoryOption.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                    <SortDesc size={20} className="text-gray-400" />
                                    <span className="text-gray-300">Sort by:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => handleSortChange(option.id)}
                                            className={`px-4 py-2 rounded-full text-sm transition-colors ${
                                                sortOrder === option.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content */}
                    {error ? (
                        <Card className="bg-red-900/20 border-red-900">
                            <CardContent className="pt-6">
                                <p className="text-red-400">{error}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <MediaGrid
                            items={localMediaItems}
                            loading={loading}
                            onItemClick={handleCardClick}
                            emptyMessage="No items found in your library"
                        />
                    )}
                </div>

                {/* Library Item Details Dialog */}
                <LibraryItemDetailsDialog 
                    isOpen={dialogOpen}
                    onClose={handleCloseDialog}
                    mediaItem={selectedItem}
                    onRatingUpdate={handleRatingUpdate}
                />
            </div>
        </div>
    );
};

export default LibraryPage;