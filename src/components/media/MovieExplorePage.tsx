import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Compass, Shuffle, TrendingUp, Star } from 'lucide-react';
import { EnhancedMediaCard } from './MediaComponents';
import { useMovies, useSearch } from '../../hooks/tmdb';
import {isMovie} from "../../services/utils/mediaUtils.ts";

const CategoryTab: React.FC<{
    icon: React.ElementType;
    label: string;
    active: boolean;
    onClick: () => void;
}> = ({ icon: Icon, label, active, onClick }) => (
    <Card
        className={`cursor-pointer transition-colors ${
            active ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
        }`}
        onClick={onClick}
    >
        <CardContent className="flex items-center justify-center p-6">
            <Icon className={`mr-2 h-5 w-5 ${active ? 'text-white' : 'text-blue-400'}`} />
            <span className={active ? 'text-white' : 'text-gray-300'}>{label}</span>
        </CardContent>
    </Card>
);

export const MovieExplorePage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'popular' | 'top_rated' | 'trending' | 'random'>('popular');

    const {
        movies,
        loading: moviesLoading,
        error: moviesError,
        hasMore,
        loadMore,
        getRandomMovies // New function we'll add to useMovies
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

    const handleTabChange = async (newTab: typeof activeTab) => {
        setActiveTab(newTab);
        if (newTab === 'random') {
            await getRandomMovies();
        }
    };

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
                <div className="relative mb-8">
                    <Input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search movies..."
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white pl-12"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"/>
                </div>

                {/* Category Tabs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                        {icon: TrendingUp, label: 'Trending', value: 'trending'},
                        {icon: Star, label: 'Top Rated', value: 'top_rated'},
                        {icon: Shuffle, label: 'Random', value: 'random'}
                    ].map(({icon: Icon, label, value}) => (
                        <CategoryTab
                            key={value}
                            icon={Icon}
                            label={label}
                            active={activeTab === value}
                            onClick={() => handleTabChange(value as typeof activeTab)}
                        />
                    ))}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array(10).fill(0).map((_, i) => (
                            <Card key={i} className="h-72 animate-pulse bg-gray-800"/>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-red-400 text-center py-8">
                        {error}
                    </div>
                )}

                {/* Content */}
                {!isLoading && !error && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {displayedShows
                                .filter(isMovie)
                                .map((movie) => (
                                    <EnhancedMediaCard
                                        key={movie.id}
                                        id={movie.id}
                                        title={movie.title}
                                        imageUrl={movie.poster_path ? `${import.meta.env.VITE_TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : null}
                                        rating={(movie.vote_average / 2).toFixed(1)}
                                        year={new Date(movie.release_date).getFullYear()}
                                        mediaType="film"
                                    />
                                ))}
                        </div>

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
                                            <div
                                                className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
                                        </div>
                                    ) : (
                                        'Load More'
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* Loading States */}
                {isLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array(10).fill(0).map((_, i) => (
                            <Card key={i} className="h-72 animate-pulse bg-gray-800"/>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-red-400 text-center py-8">
                        {error}
                    </div>
                )}

                {/* No Results */}
                {!isLoading && displayedShows.length === 0 && (
                    <div className="text-center text-gray-400 py-12">
                        No movies found
                    </div>
                )}
            </div>
        </div>
    );
};