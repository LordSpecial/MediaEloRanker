import React from 'react';
import { Card, CardContent } from '../ui/card.tsx';
import { Compass } from 'lucide-react';

interface MediaCardProps {
    title: string;
    imageId: number;
    rating: string;
    year: number;
}

export const MediaCard: React.FC<MediaCardProps> = ({ title, imageId, rating, year }) => (
    <div className="flex-shrink-0 w-48 mr-4">
        <Card className="h-72 overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
            <div className="h-48 bg-gray-800 relative">
                <img
                    src={`/api/placeholder/${200}/${250}`}
                    alt={title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-gray-900 px-2 py-1 rounded-md text-sm">
                    ★ {rating}
                </div>
            </div>
            <CardContent className="p-3">
                <h3 className="font-medium text-sm text-white truncate">{title}</h3>
                <p className="text-xs text-gray-400">{year}</p>
            </CardContent>
        </Card>
    </div>
);

interface MediaCarouselProps {
    title: string;
    items: MediaCardProps[];
    onExplore: () => void;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({ title, items, onExplore }) => (
    <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button
                onClick={onExplore}
                className="flex items-center px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
                Explore <Compass className="ml-2 h-4 w-4" />
            </button>
        </div>
        <div className="flex overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
            {items.map((item, index) => (
                <MediaCard key={index} {...item} />
            ))}
        </div>
    </div>
);

// Mock data generator helper
export const generateMockMediaItems = (count: number) =>
    Array(count).fill(null).map((_, i) => ({
        title: `Title ${i + 1}`,
        imageId: i,
        rating: (Math.random() * 2 + 3).toFixed(1),
        year: 2024 - Math.floor(Math.random() * 5)
    }));