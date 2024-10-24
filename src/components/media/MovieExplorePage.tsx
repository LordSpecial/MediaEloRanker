import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Compass, Shuffle, TrendingUp, Star } from 'lucide-react';
import { MediaCard } from './MediaComponents';
import { useMovies } from '../../hooks/tmdb/useMovies';
import { useSearch } from '../../hooks/tmdb/useSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const MovieExplorePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'trending' | 'top_rated' | 'random' | 'discover'>('trending');

    const { movies: trendingMovies, loading: trendingLoading, error: trendingError } =
        useMovies(activeTab === 'trending' ? 'popular' : 'top_rated');

    const {
        query,
        results: searchResults,
        loading: searchLoading,
        error: searchError,
        setQuery
    } = useSearch({ autoSearch: true });

    const isLoading = searchLoading || trendingLoading;
    const error = searchError || trendingError;
    const displayedMovies = query ? searchResults : trendingMovies;

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
    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

    {/* Category Tabs */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
                { icon: TrendingUp, label: 'Trending', value: 'trending' },
    { icon: Star, label: 'Top Rated', value: 'top_rated' },
    { icon: Shuffle, label: 'Random', value: 'random' },
    { icon: Compass, label: 'Discover', value: 'discover' }
].map(({ icon: Icon, label, value }) => (
        <Card
            key={value}
    className={`cursor-pointer transition-colors ${
        activeTab === value ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
    }`}
    onClick={() => setActiveTab(value as typeof activeTab)}
>
    <CardContent className="flex items-center justify-center p-6">
    <Icon className={`mr-2 h-5 w-5 ${
        activeTab === value ? 'text-white' : 'text-blue-400'
    }`} />
    <span className={activeTab === value ? 'text-white' : 'text-gray-300'}>
    {label}
    </span>
    </CardContent>
    </Card>
))}
    </div>

    {/* Error State */}
    {error && (
        <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
        </Alert>
    )}

    {/* Content */}
    {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array(10).fill(0).map((_, i) => (
        <Skeleton key={i} className="aspect-[2/3] h-72" />
    ))}
        </div>
    ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayedMovies.map((movie) => (
                    <MediaCard
                        key={movie.id}
                title={movie.title}
                imageUrl={getImageUrl(movie.poster_path)}
        rating={(movie.vote_average / 2).toFixed(1)}
        year={new Date(movie.release_date).getFullYear()}
        />
    ))}
        </div>
    )}
    </div>
    </div>
);
};