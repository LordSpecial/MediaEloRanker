import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { tmdbApiClient, TMDBMovie, TMDBTVShow } from "../../services/api/tmdb";
import { formatMediaItem } from "../../services/utils/mediaUtils.ts";
import { MediaCarousel, generateMockMediaItems } from '../media/MediaComponents';
import { MediaCardProps } from '../media/EnhancedMediaCard';

export const DiscoverPage = () => {
    const navigate = useNavigate();
    const [trendingMovies, setTrendingMovies] = useState<TMDBMovie[]>([]);
    const [trendingTV, setTrendingTV] = useState<TMDBTVShow[]>([]);
    const [moviesLoading, setMoviesLoading] = useState(true);
    const [tvLoading, setTVLoading] = useState(true);

    // Fetch trending movies and TV shows
    useEffect(() => {
        const fetchTrending = async () => {
            try {
                // Fetch trending movies
                setMoviesLoading(true);
                const moviesResponse = await tmdbApiClient.getTrending('movie', 'week');
                setTrendingMovies(moviesResponse.results as TMDBMovie[]);
                setMoviesLoading(false);

                // Fetch trending TV shows
                setTVLoading(true);
                const tvResponse = await tmdbApiClient.getTrending('tv', 'week');
                setTrendingTV(tvResponse.results as TMDBTVShow[]);
                setTVLoading(false);
            } catch (error) {
                console.error('Error fetching trending content:', error);
                setMoviesLoading(false);
                setTVLoading(false);
            }
        };

        fetchTrending();
    }, []);

    // Format and type-check the media items
    const formattedMovies = React.useMemo((): MediaCardProps[] => 
        trendingMovies.map(movie => ({
            ...formatMediaItem(movie),
            id: movie.id // Ensure id is a number for EnhancedMediaCard
        })),
    [trendingMovies]);

    const formattedTVShows = React.useMemo((): MediaCardProps[] => 
        trendingTV.map(show => ({
            ...formatMediaItem(show),
            id: show.id // Ensure id is a number for EnhancedMediaCard
        })),
    [trendingTV]);

    // Transform mock data to match expected format with numeric IDs
    const formatMockItems = (items: ReturnType<typeof generateMockMediaItems>, type: 'anime' | 'music'): MediaCardProps[] => {
        return items.map((item, index) => ({
            id: index, // Use number for EnhancedMediaCard
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
            routePath: '/explore/movies',
            items: formattedMovies,
            loading: moviesLoading
        },
        {
            title: 'Popular TV Shows',
            type: 'tv',
            routePath: '/explore/tv',
            items: formattedTVShows,
            loading: tvLoading
        },
        {
            title: 'Popular Anime',
            type: 'anime',
            routePath: '/explore/anime',
            items: formatMockItems(generateMockMediaItems(10), 'anime'),
            loading: false
        },
        {
            title: 'Hot Albums',
            type: 'music',
            routePath: '/explore/music',
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
                        onExplore={() => navigate(category.routePath)}
                        loading={category.loading}
                    />
                ))}
            </div>
        </div>
    );
};

export default DiscoverPage; 