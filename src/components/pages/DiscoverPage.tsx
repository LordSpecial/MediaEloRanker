import React from 'react';
import { useNavigate } from "react-router-dom";
import { useMovies, useTV } from "../../hooks/tmdb";
import { formatMediaItem } from "../../services/utils/mediaUtils.ts";
import { MediaCarousel, generateMockMediaItems } from '../media/MediaComponents';

export const DiscoverPage = () => {
    const navigate = useNavigate();
    const { movies: trendingMovies, loading: moviesLoading } = useMovies('trending', { timeWindow: 'week' });
    const { shows: trendingTV, loading: tvLoading } = useTV('trending', { timeWindow: 'week' });

    // Format and type-check the media items
    const formattedMovies = React.useMemo(() =>
            trendingMovies.map(formatMediaItem),
        [trendingMovies]
    );

    const formattedTVShows = React.useMemo(() =>
            trendingTV.map(formatMediaItem),
        [trendingTV]
    );

    // Note: We have to deal with a type mismatch between MediaCardProps in MediaComponents.tsx (id?: string)
    // and EnhancedMediaCard.tsx (id?: number)
    // Transform mock data to match expected format with string IDs
    const formatMockItems = (items: ReturnType<typeof generateMockMediaItems>, type: 'anime' | 'music') => {
        return items.map((item, index) => ({
            id: String(index), // Convert to string to match MediaCardProps in MediaComponents.tsx
            title: item.title,
            imageUrl: null,
            rating: item.rating,
            year: item.year,
            mediaType: type
        }));
    };

    const categories = [
        {
            title: 'Trending Movies',
            type: 'movies',
            items: formattedMovies,
            loading: moviesLoading
        },
        {
            title: 'Popular TV Shows',
            type: 'tv',
            items: formattedTVShows,
            loading: tvLoading
        },
        {
            title: 'Popular Anime',
            type: 'anime',
            items: formatMockItems(generateMockMediaItems(10), 'anime'),
            loading: false
        },
        {
            title: 'Hot Albums',
            type: 'music',
            items: formatMockItems(generateMockMediaItems(10), 'music'),
            loading: false
        }
    ];

    return (
        <div className="min-h-screen bg-gray-900 pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8">Discover</h1>

                {categories.map((category) => (
                    <MediaCarousel
                        key={category.type}
                        title={category.title}
                        items={category.items}
                        onExplore={() => navigate(`/explore/${category.type}`)}
                        loading={category.loading}
                    />
                ))}
            </div>
        </div>
    );
};

export default DiscoverPage; 