import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, Shuffle, Star } from 'lucide-react';
import { EnhancedMediaCard } from './EnhancedMediaCard';
import { useMovies, useSearch } from '../../hooks/tmdb';
import { isMovie } from "../../services/utils/mediaUtils.ts";
import { getImageUrl } from '../../services/config/tmdb.config';
import { 
    MediaGrid, 
    SearchInput, 
    CategoryTabs 
} from '@/components/ui/media';
import { MediaCardProps } from '@/components/ui/media/MediaCard';

export const MovieExplorePage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'popular' | 'top_rated' | 'trending' | 'random'>('popular');

    const {
        movies,
        loading: moviesLoading,
        error: moviesError,
        hasMore,
        loadMore,
        getRandomMovies
    } = useMovies(activeTab);

    const {
        query,
        results: searchResults,
        loading: searchLoading,
        error: searchError,
        setQuery
    } = useSearch({ autoSearch: true });

    const isLoading = searchLoading || (moviesLoading && !movies.length);
    const error = searchError || moviesError;
    const displayedShows = query ? searchResults : movies;

    const handleTabChange = async (newTab: string) => {
        setActiveTab(newTab as typeof activeTab);
        if (newTab === 'random') {
            await getRandomMovies();
        }
    };

    const movieTabs = [
        { icon: TrendingUp, label: 'Trending', value: 'trending' },
        { icon: Star, label: 'Top Rated', value: 'top_rated' },
        { icon: Shuffle, label: 'Random', value: 'random' }
    ];

    const handleCardClick = (item: MediaCardProps) => {
        // Handle card click - show details dialog
        // This will be integrated with EnhancedMediaCard later
    };

    const filteredMovies = displayedShows
        .filter(isMovie)
        .map(movie => ({
            id: movie.id,
            title: movie.title,
            imageUrl: getImageUrl(movie.poster_path),
            rating: (movie.vote_average / 2).toFixed(1),
            year: new Date(movie.release_date).getFullYear(),
            mediaType: 'film' as const
        }));

    return (
        <div className="min-h-screen bg-gray-900 pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold text-white">Movies</h1>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/discover')}
                        className="text-blue-400 hover:text-blue-300"
                    >
                        Back to Discover
                    </Button>
                </div>

                {/* Search */}
                <SearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder="Search movies..."
                    className="mb-8"
                />

                {/* Category Tabs */}
                <CategoryTabs
                    tabs={movieTabs}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />

                {/* Error State */}
                {error && (
                    <div className="text-red-400 text-center py-8">
                        {error}
                    </div>
                )}

                {/* Media Grid with Movies */}
                <MediaGrid
                    items={filteredMovies}
                    loading={isLoading}
                    onItemClick={handleCardClick}
                    emptyMessage="No movies found"
                />

                {/* Load More Button */}
                {hasMore && !query && (
                    <div className="flex justify-center my-8">
                        <Button
                            onClick={loadMore}
                            disabled={moviesLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {moviesLoading ? (
                                <div className="flex items-center">
                                    <span className="mr-2">Loading</span>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
                                </div>
                            ) : (
                                'Load More'
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};