import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Compass, Shuffle, TrendingUp, Star } from 'lucide-react';
import { generateMockMediaItems } from './MediaComponents';
import { 
    MediaGrid, 
    SearchInput, 
    CategoryTabs 
} from '@/components/ui/media';
import { MediaCardProps } from '@/components/ui/media/MediaCard';
import { MediaDetailsDialogWrapper } from '@/components/ui/discover/MediaDetailsDialogWrapper';

export const MediaExplorePage: React.FC = () => {
    const { mediaType } = useParams<{ mediaType: string }>();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('trending');
    const [selectedMedia, setSelectedMedia] = useState<MediaCardProps | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    const mockItems = generateMockMediaItems(20);
    const filteredItems = query
        ? mockItems.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()))
        : mockItems;

    const mediaTypeLabels: Record<string, string> = {
        movies: 'Movies',
        tv: 'TV Shows',
        anime: 'Anime',
        music: 'Albums'
    };

    const mediaTabs = [
        { icon: TrendingUp, label: 'Trending', value: 'trending' },
        { icon: Star, label: 'Top Rated', value: 'top_rated' },
        { icon: Shuffle, label: 'Random', value: 'random' },
        { icon: Compass, label: 'Explore All', value: 'explore' }
    ];

    const handleCardClick = (item: MediaCardProps) => {
        console.log('Clicked on:', item.title);
        setSelectedMedia(item);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedMedia(null);
    };

    return (
        <div className="min-h-screen bg-gray-900 pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold text-white">
                        {mediaTypeLabels[mediaType || 'movies']}
                    </h1>
                    <button
                        onClick={() => navigate('/discover')}
                        className="text-blue-400 hover:text-blue-300"
                    >
                        Back to Discover
                    </button>
                </div>

                {/* Search Bar */}
                <SearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder={`Search ${mediaTypeLabels[mediaType || 'movies']}...`}
                    className="mb-8"
                />

                {/* Category Tabs */}
                <CategoryTabs
                    tabs={mediaTabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                {/* Media Grid */}
                <MediaGrid
                    items={filteredItems}
                    onItemClick={handleCardClick}
                    emptyMessage={`No ${mediaTypeLabels[mediaType || 'movies'].toLowerCase()} found`}
                />
                
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