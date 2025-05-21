import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shuffle, TrendingUp, Star } from 'lucide-react';
import { useTV } from '../../hooks/tmdb/useTV';
import { useSearch } from '../../hooks/tmdb/useSearch';
import { isRegularTVShow } from "../../services/utils/mediaTypeGuards.ts";
import { getImageUrl } from '../../services/config/tmdb.config';
import { 
    MediaGrid, 
    SearchInput, 
    CategoryTabs 
} from '@/components/ui/media';
import { MediaCardProps } from '@/components/ui/media/MediaCard';
import { MediaDetailsDialogWrapper } from '@/components/ui/discover/MediaDetailsDialogWrapper';

export const TVExplorePage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'popular' | 'top_rated' | 'trending' | 'random'>('popular');
    const [selectedMedia, setSelectedMedia] = useState<MediaCardProps | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const {
        shows,
        loading: showsLoading,
        error: showsError,
        hasMore,
        loadMore,
        getRandomShows
    } = useTV(activeTab);

    const {
        query,
        results: searchResults,
        loading: searchLoading,
        error: searchError,
        setQuery
    } = useSearch({ autoSearch: true, mediaType: 'tv' });

    const isLoading = searchLoading || (showsLoading && !shows.length);
    const error = searchError || showsError;
    const displayedShows = query ? searchResults : shows;

    const handleTabChange = async (newTab: string) => {
        setActiveTab(newTab as typeof activeTab);
        if (newTab === 'random') {
            await getRandomShows();
        }
    };

    const tvTabs = [
        { icon: TrendingUp, label: 'Trending', value: 'trending' },
        { icon: Star, label: 'Top Rated', value: 'top_rated' },
        { icon: Shuffle, label: 'Random', value: 'random' }
    ];

    const handleCardClick = (item: MediaCardProps) => {
        console.log('Clicked on TV show:', item);
        setSelectedMedia(item);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedMedia(null);
    };

    const filteredShows = displayedShows
        .filter(isRegularTVShow)
        .map(show => ({
            id: show.id,
            title: show.name,
            imageUrl: getImageUrl(show.poster_path),
            rating: (show.vote_average / 2).toFixed(1),
            year: new Date(show.first_air_date).getFullYear(),
            mediaType: 'tv' as const
        }));

    return (
        <div className="min-h-screen bg-gray-900 pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold text-white">TV Shows</h1>
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
                    placeholder="Search TV shows..."
                    className="mb-8"
                />

                {/* Category Tabs */}
                <CategoryTabs
                    tabs={tvTabs}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />

                {/* Error State */}
                {error && (
                    <div className="text-red-400 text-center py-8">
                        {error}
                    </div>
                )}

                {/* Media Grid with TV Shows */}
                <MediaGrid
                    items={filteredShows}
                    loading={isLoading}
                    onItemClick={handleCardClick}
                    emptyMessage="No TV shows found"
                />

                {/* Load More Button */}
                {hasMore && !query && (
                    <div className="flex justify-center my-8">
                        <Button
                            onClick={loadMore}
                            disabled={showsLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {showsLoading ? (
                                <div className="flex items-center">
                                    <span className="mr-2">Loading</span>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                </div>
                            ) : (
                                'Load More'
                            )}
                        </Button>
                    </div>
                )}
                
                {/* Media Details Dialog */}
                <MediaDetailsDialogWrapper 
                    isOpen={dialogOpen}
                    onClose={handleCloseDialog}
                    media={selectedMedia}
                />
            </div>
        </div>
    );
};