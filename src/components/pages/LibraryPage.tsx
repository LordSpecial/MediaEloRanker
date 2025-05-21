import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Filter, SortDesc } from 'lucide-react';
import { EnhancedMediaCard } from '../media/EnhancedMediaCard';
import { useLibraryContext } from '../../contexts/LibraryContext';
import { SortField } from '@/types/media';

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
        setSortOrder 
    } = useLibraryContext();

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
                    ) : loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : mediaItems.length === 0 ? (
                        <Card className="bg-gray-800 border-gray-700">
                            <CardContent className="pt-6">
                                <p className="text-center text-gray-400">
                                    No items found in your library
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {mediaItems.map((item) => (
                                <EnhancedMediaCard
                                    key={item.id}
                                    id={item.id}
                                    title={item.title}
                                    imageUrl={item.imageUrl}
                                    rating={item.userRating?.toString() || 'Not Rated'}
                                    year={item.releaseYear}
                                    mediaType={item.type}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LibraryPage;