import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Search, Compass, Shuffle, TrendingUp, Star } from 'lucide-react';
import { EnhancedMediaCard, generateMockMediaItems } from './MediaComponents';

export const MediaExplorePage: React.FC = () => {
    const { mediaType } = useParams<{ mediaType: string }>();
    const navigate = useNavigate();

    const mockItems = generateMockMediaItems(20);

    const mediaTypeLabels: Record<string, string> = {
        movies: 'Movies',
        tv: 'TV Shows',
        anime: 'Anime',
        music: 'Albums'
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
                <div className="relative mb-8">
                    <input
                        type="text"
                        placeholder={`Search ${mediaTypeLabels[mediaType || 'movies']}...`}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white pl-12"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                {/* Category Tabs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: TrendingUp, label: 'Trending' },
                        { icon: Star, label: 'Top Rated' },
                        { icon: Shuffle, label: 'Random' },
                        { icon: Compass, label: 'Explore All' }
                    ].map(({ icon: Icon, label }) => (
                        <Card key={label} className="bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors">
                            <CardContent className="flex items-center justify-center p-6">
                                <Icon className="mr-2 h-5 w-5 text-blue-400" />
                                <span className="text-white">{label}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Media Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {mockItems.map((item, index) => (
                        <div key={index} className="aspect-[2/3]">
                            <EnhancedMediaCard {...item} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};