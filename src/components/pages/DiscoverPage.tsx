import React, { useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { tmdbApiClient } from "../../services/api/tmdb/tmdbApiClient";
import { isMovie, isTVShow } from "../../services/utils/mediaTypeGuards";
import { getImageUrl } from "../../services/config/tmdb.config";
import { Card, CardContent } from '@/components/ui/card';
import { Search, RefreshCw } from 'lucide-react';
import { MediaCarousel } from '@/components/ui/media';
import { MediaCardProps } from '@/components/ui/media/MediaCard';
import { AsyncBoundary } from '@/components/ui/AsyncBoundary';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useAsync } from '@/hooks/common/useAsync';

export const DiscoverPage = () => {
    const navigate = useNavigate();
    const initialFetchRef = useRef(true);

    // Use the new useAsync hook for trending movies
    const {
        data: trendingMovies,
        loading: moviesLoading,
        error: moviesError,
        execute: fetchTrendingMovies
    } = useAsync(async () => {
        const response = await tmdbApiClient.getTrending('movie', 'week');
        return response.results.filter(isMovie).map(movie => ({
            id: movie.id,
            title: movie.title,
            imageUrl: getImageUrl(movie.poster_path),
            rating: (movie.vote_average / 2).toFixed(1),
            year: new Date(movie.release_date).getFullYear(),
            mediaType: 'film',
        } as MediaCardProps));
    });

    // Use the new useAsync hook for trending TV shows
    const {
        data: trendingTV,
        loading: tvLoading,
        error: tvError,
        execute: fetchTrendingTV
    } = useAsync(async () => {
        const response = await tmdbApiClient.getTrending('tv', 'week');
        return response.results.filter(isTVShow).map(show => ({
            id: show.id,
            title: show.name,
            imageUrl: getImageUrl(show.poster_path),
            rating: (show.vote_average / 2).toFixed(1),
            year: new Date(show.first_air_date).getFullYear(),
            mediaType: 'tv',
        } as MediaCardProps));
    });

    // Generate mock anime and music items
    const animeItems: MediaCardProps[] = Array(10).fill(0).map((_, i) => ({
        id: 1000 + i,
        title: `Anime Title ${i + 1}`,
        imageUrl: `https://via.placeholder.com/300x450?text=Anime+${i+1}`,
        rating: (Math.random() * 2 + 3).toFixed(1),
        year: 2024 - Math.floor(Math.random() * 5),
        mediaType: 'anime',
    }));

    const musicItems: MediaCardProps[] = Array(10).fill(0).map((_, i) => ({
        id: 2000 + i,
        title: `Album Title ${i + 1}`,
        imageUrl: `https://via.placeholder.com/300x450?text=Album+${i+1}`,
        rating: (Math.random() * 2 + 3).toFixed(1),
        year: 2024 - Math.floor(Math.random() * 5),
        mediaType: 'music',
    }));

    // Initialize data loading only once on mount
    useEffect(() => {
        if (initialFetchRef.current) {
            initialFetchRef.current = false;
            fetchTrendingMovies();
            fetchTrendingTV();
        }
    }, []); // empty dependency array to run only once on mount

    const handleRefresh = () => {
        fetchTrendingMovies();
        fetchTrendingTV();
    };

    const handleCardClick = (item: MediaCardProps) => {
        console.log('Clicked on:', item);
        // Navigate or show details
    };

    return (
        <div className="min-h-screen bg-gray-900 pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8">Discover</h1>

                {/* Search Section */}
                <Card className="mb-12 bg-gray-800 border-gray-700 hover:border-blue-600 transition-colors">
                    <CardContent className="p-8 flex flex-col md:flex-row gap-4 items-center justify-center">
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-white mb-2">Find Something New</h2>
                            <p className="text-gray-400">
                                Search across movies, TV shows, anime, and music
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/search')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full flex items-center gap-2 transition-colors"
                        >
                            <Search className="h-5 w-5" />
                            Start Searching
                        </button>
                    </CardContent>
                </Card>

                {/* Refresh Button */}
                <div className="flex justify-end mb-4">
                    <button 
                        onClick={handleRefresh}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                {/* Trending Movies Section */}
                <AsyncBoundary
                    loading={moviesLoading}
                    error={moviesError}
                    loadingText="Loading trending movies..."
                    errorFallback={(error, reset) => (
                        <ErrorMessage 
                            message="Failed to load movies" 
                            details={error.message} 
                            onRetry={() => {
                                fetchTrendingMovies();
                                if (reset) reset();
                            }}
                            severity="error"
                        />
                    )}
                >
                    {trendingMovies && (
                        <MediaCarousel
                            title="Trending Movies"
                            items={trendingMovies}
                            onExplore={() => navigate('/explore/movies')}
                            onItemClick={handleCardClick}
                        />
                    )}
                </AsyncBoundary>

                {/* Trending TV Shows Section */}
                <AsyncBoundary
                    loading={tvLoading}
                    error={tvError}
                    loadingText="Loading trending TV shows..."
                    errorFallback={(error, reset) => (
                        <ErrorMessage 
                            message="Failed to load TV shows" 
                            details={error.message} 
                            onRetry={() => {
                                fetchTrendingTV();
                                if (reset) reset();
                            }}
                            severity="error"
                        />
                    )}
                >
                    {trendingTV && (
                        <MediaCarousel
                            title="Popular TV Shows"
                            items={trendingTV}
                            onExplore={() => navigate('/explore/tv')}
                            onItemClick={handleCardClick}
                        />
                    )}
                </AsyncBoundary>

                {/* Mock Anime Section */}
                <MediaCarousel
                    title="Popular Anime"
                    items={animeItems}
                    onExplore={() => navigate('/explore/anime')}
                    onItemClick={handleCardClick}
                />

                {/* Mock Music Section */}
                <MediaCarousel
                    title="Hot Albums"
                    items={musicItems}
                    onExplore={() => navigate('/explore/music')}
                    onItemClick={handleCardClick}
                />
            </div>
        </div>
    );
};

export default DiscoverPage; 